import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCXaA-C5b0WMJmXQjfZji9OCaEKDDr85ng",
    authDomain: "bmi-proj-8cd55.firebaseapp.com",
    projectId: "bmi-proj-8cd55",
    storageBucket: "bmi-proj-8cd55.appspot.com",
    messagingSenderId: "928530905369",
    appId: "1:928530905369:web:6f44776b5fac7dd3bfad88"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("scannerContainer").style.display = "block";

    const expectedKey = "Password1012120824";
    let isProcessing = false;
    let errorLogged = false;
    let scanner;

    function initializeScanner() {
        if (typeof Html5QrcodeScanner !== 'undefined') {
            scanner = new Html5QrcodeScanner('reader', {
                qrbox: {
                    width: 300,
                    height: 300
                },
                fps: 10,
            });

            scanner.render(success, error); 
        } else {
            console.error("Html5QrcodeScanner is not defined");
        }
    }

    initializeScanner();  // Initialize the scanner on page load

    const reverseMapping = {
        'm': 'a', 'q': 'b', 'r': 'c', 'f': 'd', 'p': 'e',
        'h': 'f', 'o': 'g', 'i': 'h', 's': 'i', 'l': 'j',
        'e': 'k', 'w': 'l', 'v': 'm', 'a': 'n', 'k': 'o',
        'n': 'p', 'g': 'q', 'z': 'r', 'c': 's', 'b': 't',
        'y': 'u', 'x': 'v', 'd': 'w', 'j': 'x', 't': 'y',
        'u': 'z', 'M': 'A', 'Q': 'B', 'R': 'C', 'F': 'D',
        'P': 'E', 'H': 'F', 'O': 'G', 'I': 'H', 'S': 'I',
        'L': 'J', 'E': 'K', 'W': 'L', 'V': 'M', 'A': 'N',
        'K': 'O', 'N': 'P', 'G': 'Q', 'Z': 'R', 'C': 'S',
        'B': 'T', 'Y': 'U', 'X': 'V', 'D': 'W', 'J': 'X',
        'T': 'Y', 'U': 'Z', '7': '0', '3': '1', '8': '2',
        '0': '3', '9': '4', '4': '5', '1': '6', '5': '7',
        '6': '8', '2': '9'
    };

    function decodeData(encodedData) {
        let decodedData = '';
        for (let char of encodedData) {
            decodedData += reverseMapping[char] || char;
        }
        return decodedData;
    }

    async function getLocalTimestamp() {
        const now = new Date();
        const utcOffset = 8; 
        const localTime = new Date(now.getTime() + (utcOffset * 60 * 60 * 1000));

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const formattedDate = new Intl.DateTimeFormat('en-US', options).format(localTime);

        return formattedDate;
    }

    async function checkIfStudentExist(studentData) {
        const studentNumber = studentData.split(',')[0].trim();
        const studentDocRef = doc(db, "User Data", studentNumber);
        const studentDoc = await getDoc(studentDocRef);
        const currentPhilDateTime = await getLocalTimestamp();
        
        if (studentDoc.exists()) {
            const studentDocData = studentDoc.data();
            if (studentDocData.DateTimeScanned) {
                showAlert("QR code has already been scanned.");
                return false;
            } else {
                await updateDoc(studentDocRef, {
                    DateTimeScanned: currentPhilDateTime
                });
                return true;
            }
        } else {
            showAlert("Student record does not exist in the database.");
            return false;
        }
    }

    async function success(result) {
        if (isProcessing) return;
        isProcessing = true;
    
        let decodedData = decodeData(result);
        const dataArray = decodedData.split(',');
        const key = dataArray.pop();
        const studentData = dataArray.join(',');
    
        if (key === expectedKey) {
            const studentExists = await checkIfStudentExist(studentData);
            if (studentExists) {
                displayStudentData(studentData);
            }
        } else {
            showAlert("Invalid QR code. Please scan a valid QR code.");
        }
    
        isProcessing = false;
    }
    
    function error(err) {
        if (!errorLogged) {
            console.error(err);
            errorLogged = true;
        }
    }
    
    function showAlert(message) {
        if (typeof scanner !== 'undefined') {
            scanner.clear();  
        }
        alert(message);
        isProcessing = false;  
        initializeScanner();
    }
    
    function displayStudentData(studentData) {
        const popupContent = document.querySelector('#popup-content');
        const scannerContainer = document.getElementById("scannerContainer");
    
        popupContent.innerHTML = '';
        
        const fields = ['Student Number', 'Full Name', 'Program', 'Year Level', 'Gender', 'Age', 'Height', 'Weight', 'BMI Result'];
    
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const value = studentData.split(',')[i].trim();
            const pElement = document.createElement('p');
            pElement.innerHTML = `<strong>${field}:</strong> ${value}`;
            popupContent.appendChild(pElement);
        }
    
        scannerContainer.style.display = "none";
        document.getElementById('reader').style.display = 'none';
        document.getElementById('popup').style.display = 'block';
    
        // Stop further scanning
        if (typeof scanner !== 'undefined') {
            scanner.clear();
        }
    }
    
    document.getElementById("scanButton").addEventListener('click', function() {
        const popupContainer = document.getElementById("popup");
        const scannerContainer = document.getElementById("scannerContainer");
    
        popupContainer.style.display = "none";
        document.querySelector('#popup-content').innerHTML = '';
    
        scannerContainer.style.display = "block";
        document.getElementById('reader').style.display = 'block';
    
        isProcessing = false;

        if (typeof scanner !== 'undefined') {
            scanner.clear();  
        }
        initializeScanner(); 
    });    
});
