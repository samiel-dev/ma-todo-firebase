"use client";
import { useState, useEffect } from "react";
// Note les deux points ".." pour remonter à la racine chercher le fichier
import { db } from "../firebaseConfig"; 
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");

  // Charger les tâches
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setTasks(data);
  }

  // Ajouter une tâche
  async function addTask() {
    if (!newTask) return;
    try {
      await addDoc(collection(db, "tasks"), {
        title: newTask,
        createdAt: new Date()
      });
      setNewTask(""); 
      fetchTasks();
    } catch (e) {
      console.error("Erreur : ", e);
    }
  }

  // Supprimer une tâche
  async function deleteTask(id: string) {
    await deleteDoc(doc(db, "tasks", id));
    fetchTasks();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold mb-8 text-yellow-500">Ma Todo List Firebase 🔥</h1>
      
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Nouvelle tâche..."
          className="p-2 rounded text-black"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <button 
          onClick={addTask}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold text-black"
        >
          Ajouter
        </button>
      </div>

      <ul className="w-full max-w-md space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center bg-gray-800 p-4 rounded shadow border-l-4 border-yellow-500">
            <span>{task.title}</span>
            <button 
              onClick={() => deleteTask(task.id)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}