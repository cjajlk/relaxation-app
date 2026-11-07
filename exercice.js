// Liste des postures de yoga et méditations pour chaque jour
const yogaPostures = [
    "Posture de l'enfant",
    "Posture du chat-vache",
    "Posture du chien tête en bas",
    "Posture du cobra",
    "Posture du guerrier",
    "Posture du papillon",
    "Posture de la montagne"
];

const yogaDescriptions = [
    "Asseyez-vous sur vos talons, penchez-vous en avant, bras tendus devant vous. Respirez lentement.",
    "À quatre pattes, alternez dos rond et dos creux en synchronisant avec la respiration.",
    "Mains et pieds au sol, soulevez les hanches, formez un V inversé. Respirez profondément.",
    "Allongez-vous sur le ventre, soulevez le haut du corps en gardant les bras au sol.",
    "Debout, une jambe en avant, pliez le genou, bras levés. Respirez profondément.",
    "Assis, pieds joints, genoux ouverts, penchez-vous légèrement en avant.",
    "Debout, pieds joints, bras le long du corps, respirez calmement."
];

const meditations = [
    "Méditation guidée",
    "Scan corporel",
    "Méditation sur la gratitude",
    "Méditation sur la respiration",
    "Méditation pleine conscience",
    "Méditation sur les sons",
    "Méditation sur les sensations"
];

const meditationDescriptions = [
    "Asseyez-vous confortablement, fermez les yeux, concentrez-vous sur votre respiration.",
    "Portez attention à chaque partie de votre corps, de la tête aux pieds, en respirant calmement.",
    "Pensez à trois choses pour lesquelles vous êtes reconnaissant(e), respirez et ressentez la gratitude.",
    "Concentrez-vous sur le rythme de votre respiration, inspirez et expirez lentement.",
    "Soyez attentif à l'instant présent, laissez passer les pensées sans jugement.",
    "Écoutez les sons autour de vous, sans les analyser, juste les accueillir.",
    "Portez attention aux sensations physiques, à la température, au contact, à la posture."
];

function getTodayIndex() {
    // Retourne un index basé sur le jour de l'année
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    return day % yogaPostures.length;
}

function showTodayExercise() {
    const idx = getTodayIndex();
    document.getElementById('yoga-title').textContent = yogaPostures[idx];
    document.getElementById('yoga-desc').textContent = yogaDescriptions[idx];
    document.getElementById('meditation-title').textContent = meditations[idx];
    document.getElementById('meditation-desc').textContent = meditationDescriptions[idx];
}

document.addEventListener('DOMContentLoaded', showTodayExercise);
