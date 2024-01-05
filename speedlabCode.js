  const WEBSITEURL = "https://speedlab.webflow.io"
  
  
  // Function to update usernameHeader
  function updateUsernameHeader(user) {
    const usernameHeader = document.getElementById('usernameHeader');
    if (user && usernameHeader) {
      usernameHeader.textContent = user.email; // Set to user's email
    } else if (usernameHeader) {
      usernameHeader.textContent = ''; // Set to empty string when no user
    }
  }

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
                
              var customLink = WEBSITEURL+'/finishsetuptransaction?id='+transactionKey;
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
                                window.location.href = WEBSITEURL+`/transactionpage?id=${transactionId}`;
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
            //if the slug is /dashboard update transaction table
            if (window.location.pathname === '/dashboard') {
                updateTransactionTable(transactions, user.uid);
            }
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

    console.log(document.getElementById('sellerOngoingTransactionTableBody'));
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

            var redirectUrl = transaction.sellerUserId === userId 
            ? WEBSITEURL+`/transactionpageseller?id=${key}`
            : WEBSITEURL+`/transactionpagebuyer?id=${key}`;


            var row = document.createElement('tr');
            row.innerHTML = `
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${sellerEmail}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${buyerEmail}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.completed ? 'Completed' : 'In Progress'}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><button onclick="window.location.href='${redirectUrl}'">Details</button></td>
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
    window.location.href = WEBSITEURL+`/transactionpage?id=${transactionId}`;
}

//Transaction page logic
// slug = /transactionpagebuyer
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname === '/transactionpagebuyer') {
        var transactionId = getTransactionIdFromUrl();

        if (transactionId) {
            console.log("Displaying Buyer Transaction ID:", transactionId);
            fetchUniqueTransactionData(transactionId).then(transactionData => {
                if (transactionData) {
                    displayTransactionPageData(transactionData);
                    transactionData.buyerFiles.forEach(fileKey => fetchFileUrlAndPlay(fileKey, 'buyerAudioFilesContainer'));
                } else {
                    console.log("Buyer Transaction data not found for ID:", transactionId);
                }
            }).catch(error => {
                console.error("Error fetching Buyer Transaction data:", error);
            });
        } else {
            console.log("No Buyer Transaction ID found in URL");
        }
    }
});

// slug = /transactionpageseller
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname === '/transactionpageseller') {
        var transactionId = getTransactionIdFromUrl();

        if (transactionId) {
            checkUserStatus();
            console.log("Displaying Seller Transaction ID:", transactionId);
            fetchUniqueTransactionData(transactionId).then(transactionData => {
                if (transactionData) {
                    displayTransactionPageData(transactionData);
                    transactionData.buyerFiles.forEach(fileKey => fetchFileUrlAndPlay(fileKey, 'buyerAudioFilesContainer'));
                } else {
                    console.log("Seller Transaction data not found for ID:", transactionId);
                }
            }).catch(error => {
                console.error("Error fetching Seller Transaction data:", error);
            });

            var completeTransactionForm = document.getElementById('completetransactionform');
            if (completeTransactionForm) {
                completeTransactionForm.addEventListener('submit', function(event) {
                    event.preventDefault(); // Prevent the default form submission

                    var fileInput = document.getElementById('transactionPageSellerFileSubmit');
                    if (fileInput && fileInput.files.length > 0) {
                        uploadFiles(fileInput.files, transactionId).then(fileKeys => {
                            updateSellerFilesInTransaction(transactionId, fileKeys).then(() => {
                                console.log('Seller files uploaded and updated in transaction.');
                            }).catch(error => {
                                console.error('Error updating seller files in transaction:', error);
                            });
                        }).catch(error => {
                            console.error('Error uploading files:', error);
                        });
                    }
                });
            }
        } else {
            console.log("No Seller Transaction ID found in URL");
        }
    }
});

function checkUserStatus() {
    var user = firebase.auth().currentUser;
    if (user) {
        console.log("User is logged in. UID:", user.uid);
    } else {
        console.log("User is not logged in.");
    }
}

function updateSellerFilesInTransaction(transactionId, fileKeys) {
    return new Promise((resolve, reject) => {
        var transactionRef = firebase.database().ref('/uniqueTransactions/' + transactionId);
        transactionRef.update({ sellerFiles: fileKeys })
            .then(resolve)
            .catch(reject);
    });
}

function displayTransactionPageData(transactionData) {
    // Update transaction information
    document.getElementById('transactionpageselleremail').textContent = 'Seller: ' + (transactionData.sellerUserEmail || 'N/A');
    document.getElementById('transactionpagebuyeremail').textContent = 'Buyer: ' + (transactionData.buyerUserEmail || 'N/A');
    document.getElementById('transactionpageamount').textContent = 'Amount: $' + (transactionData.amount || 'N/A');
    document.getElementById('transactionpagedescription').textContent = 'Description: ' + (transactionData.description || 'N/A');
    document.getElementById('transactionpagemessage').textContent = 'Message: ' + (transactionData.message || 'N/A');
}

function fetchFileUrlAndPlay(fileKey, containerId) {
    const fileRef = firebase.database().ref('/files/' + fileKey);
    fileRef.once('value', snapshot => {
        if (snapshot.exists()) {
            const fileData = snapshot.val();
            if (fileData && fileData.fileUrl) {
                addAudioPlayers([fileData.fileUrl], containerId);
            } else {
                console.error('File URL not found for key:', fileKey);
            }
        } else {
            console.error('File not found for key:', fileKey);
        }
    }).catch(error => {
        console.error('Error fetching file data:', error);
    });
}

function addAudioPlayers(fileUrls, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing content

    if (fileUrls && fileUrls.length > 0) {
        fileUrls.forEach(url => {
            console.log("url: " + url)
            const playerContainer = document.createElement('div');
            playerContainer.style.width = '100%';
            playerContainer.style.marginBottom = '10px';
            
            const videoPlayer = document.createElement('video');
            videoPlayer.controls = true;
            videoPlayer.autoplay = false; // Set to false for user control
            videoPlayer.name = 'media';
            videoPlayer.style.width = '100%';

            const source = document.createElement('source');
            source.src = url;
            source.type = 'audio/mpeg'; // Assuming your files are in mp3 format

            videoPlayer.appendChild(source);
            playerContainer.appendChild(videoPlayer);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = true;
            downloadLink.textContent = 'Download';
            downloadLink.style.display = 'block';
            downloadLink.style.marginTop = '5px';

            playerContainer.appendChild(downloadLink);
            container.appendChild(playerContainer);
        });
    } else {
        const noFilesMessage = document.createElement('p');
        noFilesMessage.textContent = 'No files available for playback.';
        container.appendChild(noFilesMessage);
    }
}
