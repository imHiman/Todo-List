import React from 'react';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SignUp from './components/SignUp';
import TodoApp from './App';
import { TaskProvider } from './contexts/TaskContext';

function AppWrapper() {
  const { currentUser } = useAuth();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/login" element={
          !currentUser ? <Login /> : <Navigate to="/" />
        } />
        <Route path="/signup" element={
          !currentUser ? <SignUp /> : <Navigate to="/" />
        } />
        <Route path="/" element={
          currentUser ? (
            <TaskProvider>
              <TodoApp />
            </TaskProvider>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </>
    )
  );

  return <RouterProvider router={router} />;
}

export default AppWrapper;