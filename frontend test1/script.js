//incrustation 
document.querySelector("#incru").innerHTML ="Les nouveautés"; // test pour recuperer la balise div qui a un identifiant avec queryselector faisant une incrustation de code javascript dans le HTML avec la balise script 

document.querySelector(".incru").innerHTML ="Chez nous"; // test pour recuperer la balise div avec une class avec queryselector faisant une incrustation de code javascript dans le HTML avec la balise script 



// Gestion de la connexion/déconnexion
const authLink = document.getElementById("authLink");
let isLoggedIn = false;

authLink.addEventListener("click", () => {
    if (!isLoggedIn) {
        // Simulation d'une page de connexion
        const username = prompt("Entrez votre nom d'utilisateur :");
        if (username) {
            isLoggedIn = true;
            authLink.textContent = "Mon Compte";
            document.getElementById("username").textContent = username;
            alert(`Bienvenue, ${username} !`);
        }
    } else {
        // Déconnexion
        const confirmLogout = confirm("Voulez-vous vous déconnecter ?");
        if (confirmLogout) {
            isLoggedIn = false;
            authLink.textContent = "Connexion";
            alert("Vous avez été déconnecté.");
        }
    }
});

// Interaction avec le chat
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chat-window");

sendBtn.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        const msgElement = document.createElement("p");
        msgElement.textContent = message;
        chatWindow.appendChild(msgElement);
        chatInput.value = "";
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});

// Interaction avec la page d’accueil
const featuredList = document.getElementById("featured-list");
const topicsGrid = document.getElementById("topics-grid ul");

// Simuler des données
const featuredMessages = ["Bienvenue sur le réseau social CHEZ NOUS !", "Apéro annuel au mois de juin!", "Rejoignez nous pour jardiner ensemble"];
const topics = ["Jardinage", "Sorties avec les chiens", "Gestion des poubelles", "Où laisser les clés ?", "Donner l'eau aux plantes pendant mes vacances", "Sorties culturelles", "Apéro de l'année"];

// Remplir les éléments de la page d'accueil
featuredMessages.forEach(msg => {
    const li = document.createElement("li");
    li.textContent = msg;
    featuredList.appendChild(li);
});

topics.forEach(topic => {
    const li = document.createElement("li");
    li.textContent = topic;
    topicsGrid.appendChild(li);
});

// Redirection selon l'état de connexion
window.onload = () => {
    const profileSection = document.getElementById("profile");
    const homeSection = document.getElementById("home");
    if (isLoggedIn) {
        homeSection.style.display = "none";
        profileSection.style.display = "block";
    } else {
        homeSection.style.display = "block";
        profileSection.style.display = "none";
    }
};
