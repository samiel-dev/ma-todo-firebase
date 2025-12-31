"use client";
import { useState, useEffect } from "react";
// On importe auth en plus de db
import { db, auth } from "../firebaseConfig"; 
import { 
  collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, orderBy, where 
} from "firebase/firestore";
// On importe les outils de connexion Google
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState<any>(null); // Qui est connecté ?
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Surveiller si quelqu'un se connecte ou se déconnecte
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchTasks(currentUser.uid); // Si connecté, on charge SES tâches
      } else {
        setTasks([]); // Si déconnecté, on vide la liste
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Connexion avec Google
  async function handleLogin() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  // 3. Déconnexion
  async function handleLogout() {
    await signOut(auth);
  }

  // 4. Charger les tâches de l'utilisateur connecté UNIQUEMENT
  async function fetchTasks(userId: string) {
    setLoading(true);
    // La requête change : on ajoute "where" pour filtrer par ID utilisateur
    const q = query(
      collection(db, "tasks"), 
      where("uid", "==", userId), // <--- LE FILTRE MAGIQUE
      orderBy("createdAt", "desc")
    );
    
    try {
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    } catch (error) {
      console.error("Erreur de chargement", error);
      // Petite astuce : si l'index manque, Firebase le dira dans la console (F12)
    }
    setLoading(false);
  }

  // 5. Ajouter une tâche signée
  async function addTask() {
    if (!newTask || !user) return;
    await addDoc(collection(db, "tasks"), {
      title: newTask,
      createdAt: new Date(),
      completed: false,
      uid: user.uid // <--- On signe la tâche avec l'ID de l'utilisateur
    });
    setNewTask(""); 
    fetchTasks(user.uid);
  }

  // Reste identique : Update et Delete
  async function toggleTask(id: string, currentStatus: boolean) {
    await updateDoc(doc(db, "tasks", id), { completed: !currentStatus });
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
  }
  async function deleteTask(id: string) {
    await deleteDoc(doc(db, "tasks", id));
    if(user) fetchTasks(user.uid);
  }

  // --- L'INTERFACE ---
  
  // Si l'utilisateur n'est pas connecté, on montre l'écran de Login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Bienvenue
        </h1>
        <p className="mb-8 text-gray-400 text-center">Connecte-toi pour gérer tes tâches privées.</p>
        <button 
          onClick={handleLogin}
          className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition flex items-center gap-3"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
          Se connecter avec Google
        </button>
      </div>
    );
  }

  // Si connecté, on montre l'application
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6 md:p-10 font-sans">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          {/* Photo de profil Google */}
          <img src={user.photoURL} alt="Profil" className="w-10 h-10 rounded-full border-2 border-yellow-500" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Bonjour,</span>
            <span className="font-bold">{user.displayName}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 bg-gray-800 px-3 py-1 rounded">
          Déconnexion
        </button>
      </div>
      
      {/* Zone d'ajout */}
      <div className="flex gap-2 mb-8 w-full max-w-md">
        <input
          type="text"
          placeholder="Nouvelle mission..."
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

      {/* Liste */}
      {loading ? (
        <p className="text-gray-500 animate-pulse">Chargement de tes données...</p>
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
                <input 
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => toggleTask(task.id, task.completed)}
                  className="w-5 h-5 accent-yellow-500 cursor-pointer rounded"
                />
                <span className={`text-lg truncate ${task.completed ? "line-through text-gray-500" : ""}`}>
                  {task.title}
                </span>
              </div>
              <button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-500 p-2">✕</button>
            </li>
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-gray-600 mt-10">Aucune tâche pour l'instant. Repose-toi ! 🌴</p>
          )}
        </ul>
      )}
    </div>
  );
}