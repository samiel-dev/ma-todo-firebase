"use client";
import { useState, useEffect } from "react";
// On garde l'import de ta config
import { db } from "../firebaseConfig"; 
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, // <--- NOUVEAU : Pour modifier
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }

  // Ajouter une tâche
  async function addTask() {
    if (!newTask) return;
    try {
      await addDoc(collection(db, "tasks"), {
        title: newTask,
        createdAt: new Date(),
        completed: false // <--- NOUVEAU : Par défaut, la tâche n'est pas finie
      });
      setNewTask(""); 
      fetchTasks();
    } catch (e) {
      console.error("Erreur : ", e);
    }
  }

  // NOUVEAU : Cocher / Décocher une tâche
  async function toggleTask(id: string, currentStatus: boolean) {
    // On dit à Firebase : "Prends ce document et inverse la valeur de 'completed'"
    await updateDoc(doc(db, "tasks", id), {
      completed: !currentStatus
    });
    // On met à jour l'affichage localement tout de suite (plus rapide pour l'œil)
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !currentStatus } : task
    ));
  }

  // Supprimer une tâche
  async function deleteTask(id: string) {
    await deleteDoc(doc(db, "tasks", id));
    fetchTasks();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-10 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
        Ma Todo List V2 🔥
      </h1>
      
      {/* Zone d'ajout */}
      <div className="flex gap-2 mb-8 w-full max-w-md">
        <input
          type="text"
          placeholder="Qu'allons-nous faire ?"
          className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500 transition"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <button 
          onClick={addTask}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold transition transform active:scale-95"
        >
          +
        </button>
      </div>

      {/* Liste des tâches */}
      {loading ? (
        <p className="text-gray-500 animate-pulse">Chargement...</p>
      ) : (
        <ul className="w-full max-w-md space-y-3">
          {tasks.map((task) => (
            <li 
              key={task.id} 
              className={`
                flex justify-between items-center p-4 rounded-lg shadow-lg transition-all duration-300
                ${task.completed ? "bg-gray-800/50 opacity-60" : "bg-gray-800 border-l-4 border-yellow-500"}
              `}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* La case à cocher personnalisée */}
                <input 
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => toggleTask(task.id, task.completed)}
                  className="w-5 h-5 accent-yellow-500 cursor-pointer rounded"
                />
                
                {/* Le texte (rayé si fini) */}
                <span className={`text-lg truncate ${task.completed ? "line-through text-gray-500" : ""}`}>
                  {task.title}
                </span>
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="text-gray-500 hover:text-red-500 transition p-2"
                title="Supprimer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}