import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Candidate, Position, VoteRecord, ElectionConfig, DEFAULT_POSITIONS, DEFAULT_CONFIG } from './types';

const CONFIG_DOC_ID = 'main_election_config';

/**
 * Initialize positions and config in Firestore if not already present.
 */
export async function initializeElectionData(): Promise<void> {
  try {
    const configRef = doc(db, 'election_config', CONFIG_DOC_ID);
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      await setDoc(configRef, {
        ...DEFAULT_CONFIG,
        createdAt: Date.now()
      });
    } else {
      const data = configSnap.data();
      const updates: any = {};
      if (!data.appName) {
        updates.appName = DEFAULT_CONFIG.appName;
      }
      if (!data.adminUsername) {
        updates.adminUsername = 'adminhuda';
      }
      if (!data.adminPassword || data.adminPassword === 'admin') {
        updates.adminPassword = 'hudaahiaelection';
      }
      if (Object.keys(updates).length > 0) {
        await updateDoc(configRef, updates);
      }
    }

    // Seed positions if empty
    const positionsCol = collection(db, 'positions');
    const positionsSnap = await getDocs(positionsCol);
    
    if (positionsSnap.empty) {
      for (const pos of DEFAULT_POSITIONS) {
        await setDoc(doc(db, 'positions', pos.id), pos);
      }
    }
  } catch (err) {
    console.warn('Notice: Firestore initial data seed check skipped or operating offline:', err);
  }
}

/**
 * Subscribe to election positions in real-time.
 */
export function subscribeToPositions(callback: (positions: Position[]) => void) {
  try {
    const colRef = collection(db, 'positions');
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        callback(DEFAULT_POSITIONS);
        return;
      }
      const list: Position[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Position);
      });
      list.sort((a, b) => a.order - b.order);
      callback(list.length > 0 ? list : DEFAULT_POSITIONS);
    }, (err) => {
      console.warn('Real-time positions listener error (falling back to defaults):', err);
      callback(DEFAULT_POSITIONS);
    });
  } catch (err) {
    console.warn('Could not attach positions snapshot listener:', err);
    callback(DEFAULT_POSITIONS);
    return () => {};
  }
}

/**
 * Subscribe to election config.
 */
export function subscribeToConfig(callback: (config: ElectionConfig) => void) {
  try {
    const configRef = doc(db, 'election_config', CONFIG_DOC_ID);
    return onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...DEFAULT_CONFIG,
          ...data,
          appName: data.appName || DEFAULT_CONFIG.appName,
          adminUsername: data.adminUsername || 'adminhuda',
          adminPassword: data.adminPassword || 'hudaahiaelection'
        } as ElectionConfig);
      } else {
        callback(DEFAULT_CONFIG);
      }
    }, (err) => {
      console.warn('Config snapshot error (falling back to defaults):', err);
      callback(DEFAULT_CONFIG);
    });
  } catch (err) {
    console.warn('Could not attach config snapshot listener:', err);
    callback(DEFAULT_CONFIG);
    return () => {};
  }
}

/**
 * Subscribe to all votes in real-time for live admin counting.
 */
export function subscribeToVotes(
  callback: (votes: VoteRecord[]) => void,
  onError?: (err: any) => void
) {
  try {
    const votesCol = collection(db, 'votes');
    const q = query(votesCol, orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const votes: VoteRecord[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        votes.push({
          id: docSnap.id,
          voterName: data.voterName || 'Anonymous',
          adNo: data.adNo || data.voterId || 'N/A',
          voterId: data.adNo || data.voterId || 'N/A',
          selections: data.selections || {},
          submittedAt: data.submittedAt || Date.now(),
          verificationHash: data.verificationHash || 'BALLOT-RECORDED',
          avatarUrl: data.avatarUrl
        });
      });
      callback(votes);
    }, (err) => {
      console.error('Votes snapshot error:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error('Could not attach votes snapshot listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Submit a ballot with voter selections for both positions.
 */
export async function submitBallot(
  voterName: string, 
  adNo: string, 
  selections: { [positionId: string]: { candidateId: string; candidateName: string } }
): Promise<{ success: boolean; voteId: string; hash: string }> {
  const timestamp = Date.now();
  const cleanName = voterName.trim();
  const cleanAdNo = adNo.trim();

  // Generate a tamper-evident digital receipt verification hash
  const rawHashString = `${cleanAdNo}-${cleanName}-${timestamp}-${JSON.stringify(selections)}`;
  let hashNum = 0;
  for (let i = 0; i < rawHashString.length; i++) {
    hashNum = (hashNum << 5) - hashNum + rawHashString.charCodeAt(i);
    hashNum |= 0;
  }
  const verificationHash = 'VOTE-' + Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0');

  const ballot: VoteRecord = {
    voterName: cleanName,
    adNo: cleanAdNo,
    voterId: cleanAdNo,
    selections,
    submittedAt: timestamp,
    verificationHash
  };

  const voteDocRef = await addDoc(collection(db, 'votes'), ballot);

  // Update aggregated tally counters for quick queries
  try {
    const batch = writeBatch(db);
    for (const [posId, sel] of Object.entries(selections)) {
      const tallyRef = doc(db, 'tallies', `${posId}_${sel.candidateId}`);
      batch.set(tallyRef, {
        positionId: posId,
        candidateId: sel.candidateId,
        candidateName: sel.candidateName,
        voteCount: increment(1),
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }

    // Audit log entry
    const auditRef = doc(collection(db, 'audit_logs'));
    batch.set(auditRef, {
      action: 'BALLOT_CAST',
      adNoMasked: cleanAdNo.slice(0, 2) + '***' + cleanAdNo.slice(-2),
      voterName: cleanName,
      timestamp,
      verificationHash
    });

    await batch.commit();
  } catch (tallyErr) {
    console.warn('Note: Tallies batch update notice:', tallyErr);
  }

  return { success: true, voteId: voteDocRef.id, hash: verificationHash };
}

/**
 * Update global election settings & web portal name in Firebase.
 */
export async function saveElectionConfig(updates: Partial<ElectionConfig>): Promise<void> {
  const configRef = doc(db, 'election_config', CONFIG_DOC_ID);
  await setDoc(configRef, updates, { merge: true });
}

/**
 * Update an existing position in Firestore.
 */
export async function savePosition(position: Position): Promise<void> {
  const positionRef = doc(db, 'positions', position.id);
  await setDoc(positionRef, position, { merge: true });
}

/**
 * Delete a position from Firestore.
 */
export async function deletePosition(positionId: string): Promise<void> {
  const positionRef = doc(db, 'positions', positionId);
  await deleteDoc(positionRef);
}

/**
 * Update or add a candidate inside a position.
 */
export async function saveCandidate(positionId: string, updatedCandidate: Candidate): Promise<void> {
  const positionRef = doc(db, 'positions', positionId);
  const snap = await getDoc(positionRef);
  if (snap.exists()) {
    const posData = snap.data() as Position;
    const candidateIndex = posData.candidates.findIndex(c => c.id === updatedCandidate.id);
    let newCandidates = [...posData.candidates];
    if (candidateIndex >= 0) {
      newCandidates[candidateIndex] = updatedCandidate;
    } else {
      newCandidates.push(updatedCandidate);
    }
    await setDoc(positionRef, { ...posData, candidates: newCandidates }, { merge: true });
  }
}

/**
 * Delete a candidate from a position.
 */
export async function deleteCandidate(positionId: string, candidateId: string): Promise<void> {
  const positionRef = doc(db, 'positions', positionId);
  const snap = await getDoc(positionRef);
  if (snap.exists()) {
    const posData = snap.data() as Position;
    const newCandidates = posData.candidates.filter(c => c.id !== candidateId);
    await setDoc(positionRef, { ...posData, candidates: newCandidates }, { merge: true });
  }
}

/**
 * Update an individual ballot (e.g. edit voter name or Ad No typo).
 */
export async function updateVoteRecord(voteId: string, updatedData: Partial<VoteRecord>): Promise<void> {
  const voteRef = doc(db, 'votes', voteId);
  await updateDoc(voteRef, updatedData);
}

/**
 * Delete a specific ballot from Firestore.
 */
export async function deleteVoteRecord(voteId: string): Promise<void> {
  const voteRef = doc(db, 'votes', voteId);
  await deleteDoc(voteRef);
}

/**
 * Reset all votes (Admin feature)
 */
export async function resetElectionVotes(): Promise<void> {
  const votesSnap = await getDocs(collection(db, 'votes'));
  const batch = writeBatch(db);
  votesSnap.forEach(d => {
    batch.delete(d.ref);
  });

  const talliesSnap = await getDocs(collection(db, 'tallies'));
  talliesSnap.forEach(d => {
    batch.delete(d.ref);
  });

  const auditSnap = await getDocs(collection(db, 'audit_logs'));
  auditSnap.forEach(d => {
    batch.delete(d.ref);
  });

  await batch.commit();
}

/**
 * Update election status (active / paused / closed)
 */
export async function updateElectionStatus(status: 'active' | 'paused' | 'closed'): Promise<void> {
  const configRef = doc(db, 'election_config', CONFIG_DOC_ID);
  await setDoc(configRef, { status }, { merge: true });
}

/**
 * Restore original template positions and participants in Firestore.
 */
export async function restoreDefaultPositions(): Promise<void> {
  const batch = writeBatch(db);
  for (const pos of DEFAULT_POSITIONS) {
    const posRef = doc(db, 'positions', pos.id);
    batch.set(posRef, pos);
  }
  await batch.commit();
}

/**
 * Restore default election branding and config in Firestore.
 */
export async function restoreDefaultConfig(): Promise<void> {
  const configRef = doc(db, 'election_config', CONFIG_DOC_ID);
  await setDoc(configRef, DEFAULT_CONFIG);
}

/**
 * Seed sample votes for demonstration
 */
export async function seedSampleVotes(positions: Position[], count = 8): Promise<void> {
  const sampleVoters = [
    { name: 'Maya Lin', adNo: 'AD-1042' },
    { name: 'Julian Hayes', adNo: 'AD-2189' },
    { name: 'Sarah Jenkins', adNo: 'AD-3310' },
    { name: 'Devon Patel', adNo: 'AD-4055' },
    { name: 'Koa Takahashi', adNo: 'AD-5120' },
    { name: 'Chloe Dubois', adNo: 'AD-6294' },
    { name: 'Aiden Brooks', adNo: 'AD-7811' },
    { name: 'Fatima Al-Mansoor', adNo: 'AD-8923' },
    { name: 'Lucas Rivera', adNo: 'AD-9140' },
    { name: 'Grace Kim', adNo: 'AD-9502' }
  ];

  const votersToUse = sampleVoters.slice(0, count);

  for (const voter of votersToUse) {
    const selections: { [positionId: string]: { candidateId: string; candidateName: string } } = {};
    for (const pos of positions) {
      if (pos.candidates.length > 0) {
        const pick = pos.candidates[Math.floor(Math.random() * pos.candidates.length)];
        selections[pos.id] = {
          candidateId: pick.id,
          candidateName: pick.name
        };
      }
    }
    await submitBallot(voter.name, voter.adNo, selections);
  }
}
