import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

const TaskContext = createContext();

export function useTasks() {
  return useContext(TaskContext);
}

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const { currentUser } = useAuth();

  // Sync tasks with Firestore
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Add task
  async function addTask(taskData) {
    await addDoc(collection(db, 'tasks'), {
      ...taskData,
      userId: currentUser.uid,
      createdAt: new Date().toISOString()
    });
  }

  // Update task
  async function updateTask(taskId, updates) {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, updates);
  }

  // Delete task
  async function deleteTask(taskId) {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
  }

  const value = {
    tasks,
    addTask,
    updateTask,
    deleteTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}