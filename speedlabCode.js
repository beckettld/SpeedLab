
  var firebaseConfig = {
    apiKey: "AIzaSyBQguFel0NDPxwC-KGJhfYdXvWJcdKMMxQ",
    authDomain: "speedlab1-7f02c.firebaseapp.com",
    databaseURL: "https://speedlab1-7f02c-default-rtdb.firebaseio.com",
  	projectId: "speedlab1-7f02c",
  	storageBucket: "speedlab1-7f02c.appspot.com",
  	messagingSenderId: "298559435817",
  	appId: "1:298559435817:web:5b3f63875ee9dda4ef5838",
  	measurementId: "G-Y3H2W0K79V"
  };
  firebase.initializeApp(firebaseConfig);
//change
  // Function to update usernameHeader
  function updateUsernameHeader(user) {
    const usernameHeader = document.getElementById('usernameHeader');
    if (user && usernameHeader) {
      usernameHeader.textContent = user.email; // Set to user's email
    } else if (usernameHeader) {
      usernameHeader.textContent = ''; // Set to empty string when no user
    }
  }
  
  //start user sign in logic.
  // Function to handle redirection after authentication state change
function handleAuthRedirection(user) {
  if (user) {
    // User is signed in
    updateUsernameHeader(user);

    // Redirect to previously saved URL if it exists
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl && window.location.href !== redirectUrl) {
      window.location.href = redirectUrl;
      sessionStorage.removeItem('redirectAfterLogin'); // Clear the stored URL
    } else if (window.location.pathname === '/') {
      // Redirect to dashboard if on home page
      window.location.href = '/dashboard';
    }
  } else {
    // User is signed out
    console.log('User signed out');
    updateUsernameHeader(null);

    // Redirect to home page if not already there
    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', window.location.href);
      window.location.href = '/';
    }
  }
}

// Initialize auth state change listener
firebase.auth().onAuthStateChanged(handleAuthRedirection);

// Set up sign-in logic
if (window.location.pathname === '/' || window.location.pathname === '') {
  document.getElementById('LogInButton').addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  });
}
//End user sign in logic.
  
  
//Transaction Initialization Page Logic
// slug = /dashboard
document.addEventListener('DOMContentLoaded', function() {
var transactionButton = document.getElementById('initializeTransaction');
if (transactionButton) {
    transactionButton.addEventListener('click', function(event) {
        event.preventDefault();
        window.location.href = '/createnewtransaction';
    });
} else {
    console.log('initializeTransaction button not found');
}
});
  
//Create new transaction template, add it to database.
// slug = /createnewtransaction
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname === '/createnewtransaction') {
      var form = document.getElementById("newtransaction");
      form.addEventListener("submit", function(event) {
          // Getting the values from the form
          var transactionDescription = document.getElementById("transactiondescription").value;
          var amount = document.getElementById("amount").value;
          var user = firebase.auth().currentUser;

          // Creating an object to hold the form data
          
        if (user && user.email) {
            var formData = {
                description: transactionDescription,
                amount: amount,
                sellerId: user.uid, // Add the sender's user ID
                sellerEmail: user.email,
            };

          // Adding the data to Firebase Realtime Database
              var newTransactionRef = firebase.database().ref('/transactionTemplates').push();
              var transactionKey = newTransactionRef.key;
              newTransactionRef.set(formData).then(function() {
                  console.log("Transaction data saved successfully.");
                
              var customLink = 'https://speedlab.webflow.io/finishsetuptransaction?id='+transactionKey;
              console.log("Transaction link: ", customLink);
                
              var linkMessageElement = document.getElementById('transactionlinkmessage');
                linkMessageElement.textContent = 'Success! Your link is: ' + customLink;

              })
              .catch(function(error) {
                  console.log("Error saving transaction data: ", error);
              });
          } else {
              console.log("User not signed in");
              // Handle the case where the user is not signed in
          }
      });
}});

//Handle Transaction Confirmation page with link. specifically the display of data
// slug = /finishsetuptransaction
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname === '/finishsetuptransaction') {
        var transactionId = getTransactionIdFromUrl();

        if (transactionId) {
            console.log("Transaction ID:", transactionId);
            fetchTransactionData(transactionId);
            // Perform actions with the transactionId
        } else {
            console.log("No transaction ID found in URL");
        }

        var confirmForm = document.getElementById('confirmtransactionform');
        confirmForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission
            createUniqueTransaction().then(uniqueTransactionId => {
                console.log("Unique transaction created");
                window.location.href = '/reviewtransaction?id=' + uniqueTransactionId;
            }).catch(error => {
                console.error("Failed to create unique transaction:", error);
            });
        });
    }
});


function getTransactionIdFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}
  
function fetchTransactionData(transactionId) {
    var transactionTemplatesRef = firebase.database().ref('/transactionTemplates/' + transactionId);

    transactionTemplatesRef.once('value', function(snapshot) {
        if (snapshot.exists()) {
            console.log('Transaction found: ', transactionId)
            displayTransactionData(snapshot.val(), transactionId);
        } else {
            console.log("Transaction ID not found");
        }
    });
}

function displayTransactionData(transactionData, userId) {
    	if (transactionData) {
        document.getElementById('confirmtransaction-amount').textContent = 'Amount: $' + (transactionData.amount || 'No amount');
        document.getElementById('confirmtransaction-description').textContent = 'Description: ' + (transactionData.description || 'No description');
        document.getElementById('confirmtransaction-sender').textContent = 'Sent by: ' + (transactionData.sellerEmail || 'No seller');
    } else {
        console.log('No data found for this transaction ID');
    }
}

function createUniqueTransaction() {
    return new Promise((resolve, reject) => {
        var user = firebase.auth().currentUser;
        var fileInput = document.getElementById('confirmchoosefile');
        var messageInput = document.getElementById('confirmmessage');

        if (user) {
            var transactionTemplateId = getTransactionIdFromUrl();
            var transactionRef = firebase.database().ref('/transactionTemplates/' + transactionTemplateId);

            transactionRef.once('value', snapshot => {
                var transactionTemplate = snapshot.val();
                if (transactionTemplate) {
                    const { description, amount, sellerId, sellerEmail } = transactionTemplate;

                    if (fileInput && fileInput.files && fileInput.files.length > 0) {
                        uploadFiles(fileInput.files, transactionTemplateId).then(fileKeys => {
                            var uniqueTransaction = {
                                description: description,
                                amount: amount,
                                sellerUserId: sellerId,
                                sellerUserEmail: sellerEmail,
                                buyerUserId: user.uid,
                                buyerUserEmail: user.email,
                                message: messageInput ? messageInput.value : '',
                                buyerFiles: fileKeys, // Array of file keys
                                sellerFiles: [],
                                currentState: "unpaid"
                            };

                            saveUniqueTransaction(uniqueTransaction).then(uniqueTransactionId => {
                                resolve(uniqueTransactionId); // Resolve the promise with the transaction ID
                            }).catch(reject);
                        }).catch(reject);
                    } else {
                        console.log("No files selected or file input not found.");
                        reject("No files selected or file input not found.");
                    }
                } else {
                    console.log("Transaction template not found.");
                    reject("Transaction template not found.");
                }
            });
        } else {
            console.log("User not signed in");
            reject("User not signed in");
        }
    });
}

function saveUniqueTransaction(uniqueTransaction) {
    return new Promise((resolve, reject) => {
        var uniqueTransRef = firebase.database().ref('/uniqueTransactions').push();
        uniqueTransRef.set(uniqueTransaction)
            .then(() => {
                console.log("Unique transaction created successfully.");
                resolve(uniqueTransRef.key); // Return the unique transaction ID
            })
            .catch(error => {
                console.error("Error creating unique transaction: ", error);
                reject(error);
            });
    });
}

function uploadFiles(fileList, transactionId) {
    var user = firebase.auth().currentUser;
    if (user) {
        if (!Array.isArray(fileList)) {
            fileList = Array.from(fileList);
        }

        var uploadPromises = fileList.map(file => {
            let storageRef = firebase.storage().ref('sharedFiles/' + file.name);
            let uploadTask = storageRef.put(file);

            return uploadTask.then(snapshot => snapshot.ref.getDownloadURL())
                .then(downloadURL => {
                    let fileRef = firebase.database().ref('/files').push();
                    let fileData = {
                        transactionId: transactionId,
                        fileUrl: downloadURL
                    };
                    return fileRef.set(fileData).then(() => fileRef.key);
                });
        });

        return Promise.all(uploadPromises);
    } else {
        console.log("User not signed in");
        return Promise.reject("User not signed in");
    }
}

function getTransactionIdFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function displayUniqueTransactionData(uniqueTransactionData) {
    if (uniqueTransactionData) {
        // Display the seller's details
        document.getElementById('reviewSender').textContent = 'Seller: ' + (uniqueTransactionData.sellerUserEmail || 'No seller info');

        // Display the buyer's details
        document.getElementById('reviewBuyer').textContent = 'Buyer: ' + (uniqueTransactionData.buyerUserEmail || 'No buyer info');

        // Assuming buyerFiles is an array, join the file names/keys with commas
        document.getElementById('reviewFiles').textContent = 'Files: ' + (uniqueTransactionData.buyerFiles && uniqueTransactionData.buyerFiles.length > 0 ? uniqueTransactionData.buyerFiles.join(', ') : 'No files');

        // Display the seller's description
        document.getElementById('reviewSenderDescription').textContent = 'Seller Description: ' + (uniqueTransactionData.description || 'No description');

        // Display the buyer's message
        document.getElementById('reviewBuyerMessage').textContent = 'Your Message: ' + (uniqueTransactionData.message || 'No message');

        // Additional transaction details can be displayed in a similar manner
    } else {
        console.log('No data found for this transaction ID');
    }
}

//Main script for review and pay
// slug = /reviewtransaction
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname === '/reviewtransaction') {
        var transactionId = getTransactionIdFromUrl();

        if (transactionId) {
            console.log("Reviewing Transaction ID:", transactionId);
            fetchUniqueTransactionData(transactionId).then(transactionData => {
                if (transactionData) {
                    displayUniqueTransactionData(transactionData);

                    // Add event listener to the payment button
                    var payButton = document.getElementById('payfortransaction');
                    if (payButton) {
                        payButton.addEventListener('click', function() {
                            updateTransactionStateToPaid(transactionId).then(() => {
                                window.location.href = `https://speedlab.webflow.io/transactionpage?id=${transactionId}`;
                            }).catch(error => {
                                console.error("Error updating transaction state:", error);
                            });
                        });
                    }
                } else {
                    console.log("Transaction data not found for ID:", transactionId);
                }
            }).catch(error => {
                console.error("Error fetching transaction data:", error);
            });
        } else {
            console.log("No transaction ID found in URL");
        }
    }
});

function updateTransactionStateToPaid(transactionId) {
    // Assuming you're using Firebase Realtime Database
    var transactionRef = firebase.database().ref('uniqueTransactions/' + transactionId);
    return transactionRef.update({ currentState: 'paid' });
}

function fetchUniqueTransactionData(transactionId) {
    return new Promise((resolve, reject) => {
        var transactionRef = firebase.database().ref('/uniqueTransactions/' + transactionId);
        transactionRef.once('value', snapshot => {
            if (snapshot.exists()) {
                resolve(snapshot.val());
            } else {
                reject("Transaction not found");
            }
        }).catch(error => {
            reject(error);
        });
    });
}

//Displaying Data on the dashboard
// slug = /dashboard
document.addEventListener("DOMContentLoaded", function() {
    var user = firebase.auth().currentUser;
    firebase.auth().onAuthStateChanged(function(user) {
      console.log("User:", user)
    if (user) {
        var transactionsRef = firebase.database().ref('/uniqueTransactions');
        console.log(transactionsRef)
        transactionsRef.once('value', function(snapshot) {
            console.log("Transactions:", snapshot.val());
            var transactions = snapshot.val();
            updateTransactionTable(transactions, user.uid);
        });
    } else {
        console.log("User not signed in");
    }
  });
});

function updateTransactionTable(transactions, userId) {
    // Get references to all table bodies
    var sellerOngoingTableBody = document.getElementById('sellerOngoingTransactionTableBody');
    var sellerCompletedTableBody = document.getElementById('sellerCompletedTransactionTableBody');
    var buyerOngoingTableBody = document.getElementById('buyerOngoingTransactionTableBody');
    var buyerCompletedTableBody = document.getElementById('buyerCompletedTransactionTableBody');

    // Clear existing table rows
    sellerOngoingTableBody.innerHTML = '';
    sellerCompletedTableBody.innerHTML = '';
    buyerOngoingTableBody.innerHTML = '';
    buyerCompletedTableBody.innerHTML = '';

    for (var key in transactions) {
        if (transactions.hasOwnProperty(key)) {
            var transaction = transactions[key];

            // Skip transactions with currentState 'unpaid'
            if (transaction.currentState === 'unpaid') {
                continue;
            }

            const sellerEmail = transaction.sellerUserEmail || 'N/A';
            const buyerEmail = transaction.buyerUserEmail || 'N/A';
            const isCompleted = transaction.currentState === 'complete';

            var row = document.createElement('tr');
            row.innerHTML = `
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${sellerEmail}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${buyerEmail}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.completed ? 'Completed' : 'In Progress'}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><button onclick="redirectToTransactionDetails('${key}')">Details</button></td>
            `;


            // Categorize and append the row to the corresponding table
            if (transaction.sellerUserId === userId) {
                if (isCompleted) {
                    sellerCompletedTableBody.appendChild(row.cloneNode(true));
                } else {
                    sellerOngoingTableBody.appendChild(row.cloneNode(true));
                }
            }
            if (transaction.buyerUserId === userId) {
                if (isCompleted) {
                    buyerCompletedTableBody.appendChild(row.cloneNode(true));
                } else {
                    buyerOngoingTableBody.appendChild(row.cloneNode(true));
                }
            }
        }
    }
}

function redirectToTransactionDetails(transactionId) {
    window.location.href = `https://speedlab.webflow.io/reviewtransaction?id=${transactionId}`;
}

//Transaction page logic
// slug = /transactionpage
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname === '/transactionpage') {
        var transactionId = getTransactionIdFromUrl();

        if (transactionId) {
            console.log("Displaying Transaction ID:", transactionId);
            fetchUniqueTransactionData(transactionId).then(transactionData => {
                if (transactionData) {
                    // Placeholder for your future function
                    displayTransactionPageData(transactionData);

                    // Additional logic for the transaction page can be added here
                } else {
                    console.log("Transaction data not found for ID:", transactionId);
                }
            }).catch(error => {
                console.error("Error fetching transaction data:", error);
            });
        } else {
            console.log("No transaction ID found in URL");
        }
    }
});

function displayTransactionPageData(transactionData) {
    // Access each element by ID and update its content
    document.getElementById('transactionpageselleremail').textContent = transactionData.sellerUserEmail || 'N/A';
    document.getElementById('transactionpagebuyeremail').textContent = transactionData.buyerUserEmail || 'N/A';
    document.getElementById('transactionpageamount').textContent = transactionData.amount || 'N/A';
    document.getElementById('transactionpagedescription').textContent = transactionData.description || 'N/A';
    document.getElementById('transactionpagemessage').textContent = transactionData.message || 'N/A';

    // Handle buyer files - assuming these are file URLs or keys
    var buyerFilesContainer = document.getElementById('transactionpagebuyerfiles');
    buyerFilesContainer.innerHTML = ''; // Clear previous content
    if (transactionData.buyerFiles && transactionData.buyerFiles.length > 0) {
        transactionData.buyerFiles.forEach(fileKey => {
            var fileElement = document.createElement('div');
            fileElement.textContent = fileKey; // or fetch and display file data based on fileKey
            buyerFilesContainer.appendChild(fileElement);
        });
    } else {
        buyerFilesContainer.textContent = 'No files';
    }

    // Handle seller files - similar to buyer files
    var sellerFilesContainer = document.getElementById('transactionpagesellerfiles');
    sellerFilesContainer.innerHTML = ''; // Clear previous content
    if (transactionData.sellerFiles && transactionData.sellerFiles.length > 0) {
        transactionData.sellerFiles.forEach(fileKey => {
            var fileElement = document.createElement('div');
            fileElement.textContent = fileKey; // or fetch and display file data based on fileKey
            sellerFilesContainer.appendChild(fileElement);
        });
    } else {
        sellerFilesContainer.textContent = 'No files';
    }
}


