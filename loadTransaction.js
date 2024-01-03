//verify that you can load a file
/*
function logCurrentUser() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in, log user details
            console.log("Logged in User:", user);
        } else {
            // No user is signed in, log this state
            console.log("No user currently logged in");
        }
    });
}


function fetchUniqueTransactionData(transactionId) {
    return new Promise((resolve, reject) => {
        var transactionRef = firebase.database().ref('/uniqueTransactions/' + transactionId);
        transactionRef.once('value', snapshot => {
            if (snapshot.exists()) {
                const transactionData = snapshot.val();
                console.log("Transaction Data:", transactionData); // Log the transaction data
                resolve(transactionData);
            } else {
                reject("Transaction not found");
            }
        }).catch(error => {
            console.error("Error fetching transaction data:", error); // Log the error
            reject(error);
        });
    });
}


//Main script
logCurrentUser

const testId = "-Nn6w1P77VCQ_51Bz60Z"
fetchUniqueTransactionData(testId)
*/