const jsonUrl = "/api/songs"; 
const grid = document.getElementById("grid");
const audioPlayer = document.getElementById("audioPlayer");
const backBtn = document.getElementById("backBtn");
const searchBar = document.getElementById("searchBar");
const nowPlaying = document.getElementById("nowPlaying");
const playPauseBtn = document.getElementById("playPause");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

let allSongs = [];
let albums = {};
let currentAlbum = null;

// Load JSON data
async function loadData() {
  try {
    const res = await fetch(jsonUrl);
    allSongs = await res.json();
    showAlbums();
  } catch (err) {
    nowPlaying.innerText = "⚠ Could not load songs";
    console.error(err);
  }
}

// Show album grid
function showAlbums() {
  grid.innerHTML = "";
  backBtn.style.display = "none";
  searchBar.style.display = "block";

  albums = {};
  allSongs.forEach(song => {
    if (!albums[song.album]) {
      albums[song.album] = song.albumImageUrl || "";
    }
  });
  renderAlbums(Object.entries(albums));
}

// Render albums in grid
function renderAlbums(albumEntries) {
  grid.innerHTML = "";
  albumEntries.forEach(([album, img]) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<img src="${img}" alt="${album}"><h3>${album}</h3>`;
    card.onclick = () => showSongs(album);
    grid.appendChild(card);
  });
}

// Show songs of a selected album
function showSongs(album) {
  currentAlbum = album;
  grid.innerHTML = "";
  backBtn.style.display = "inline-block";
  searchBar.style.display = "none";

  const songs = allSongs.filter(s => s.album === album);
  songs.forEach(song => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${song.name}</h3>`;
    card.onclick = () => playSong(song);
    grid.appendChild(card);
  });
}

// Play selected song
function playSong(song) {
  audioPlayer.src = song.url;
  audioPlayer.play();
  nowPlaying.innerText = `▶ ${song.name} — ${song.album}`;
  playPauseBtn.textContent = "⏸";
}

// Play/Pause button
playPauseBtn.onclick = () => {
  if (audioPlayer.paused) { 
    audioPlayer.play(); 
    playPauseBtn.textContent = "⏸"; 
  } else { 
    audioPlayer.pause(); 
    playPauseBtn.textContent = "▶"; 
  }
};

// Update progress bar
audioPlayer.ontimeupdate = () => {
  progress.max = audioPlayer.duration || 0;
  progress.value = audioPlayer.currentTime;
  currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
  durationEl.textContent = formatTime(audioPlayer.duration);
};

// Seek audio
progress.oninput = () => audioPlayer.currentTime = progress.value;

// Format time mm:ss
function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

// Back to albums
backBtn.onclick = showAlbums;

// Search albums
searchBar.onfocus = () => searchBar.placeholder = "";
searchBar.onblur = () => searchBar.placeholder = "🔍 Search albums...";
searchBar.oninput = (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = Object.entries(albums).filter(([a]) => a.toLowerCase().includes(q));
  renderAlbums(filtered);
};

// Load initial data
loadData();
