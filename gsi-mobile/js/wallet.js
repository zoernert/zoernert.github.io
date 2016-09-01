   var web3 = new Web3();
      var global_keystore;
	function supports_html5_storage() {
	  try {
		return 'localStorage' in window && window['localStorage'] !== null;
	  } catch (e) {
		return false;
	  }
	}
		
      function setWeb3Provider(keystore) {
        var web3Provider = new HookedWeb3Provider({
//          host: "http://microdao.stromhaltig.de:8545",
        host: "http://localhost:8545",
          transaction_signer: keystore
        });

        web3.setProvider(web3Provider);
      }

      function newAddresses(password) {
                
        var numAddr = 1;

        lightwallet.keystore.deriveKeyFromPassword(password, function(err, pwDerivedKey) {

        global_keystore.generateNewAddress(pwDerivedKey, numAddr);

        var addresses = global_keystore.getAddresses();
		console.log(addresses);
        gsi.address="0x"+addresses[0];
		unlockedWallet();
        //getBalances();
      })
      }

      function getBalances() {
        
        var addresses = global_keystore.getAddresses();
        document.getElementById('addr').innerHTML = 'Retrieving addresses...'

        async.map(addresses, web3.eth.getBalance, function(err, balances) {
          async.map(addresses, web3.eth.getTransactionCount, function(err, nonces) {
            document.getElementById('addr').innerHTML = ''
            for (var i=0; i<addresses.length; ++i) {
              document.getElementById('addr').innerHTML += '<div>' + addresses[i] + ' (Bal: ' + (balances[i] / 1.0e18) + ' ETH, Nonce: ' + nonces[i] + ')' + '</div>'
            }
          })
        })

      }

      function setSeed() {
        var password = $('#pwd').val();
                                              
        lightwallet.keystore.deriveKeyFromPassword(password, function(err, pwDerivedKey) {

				global_keystore = new lightwallet.keystore(
				  $('#seedIn').val(), 
				  pwDerivedKey);
				if(supports_html5_storage()) {
						window.localStorage.setItem("seed",$('#seedIn').val());		
				}
				//document.getElementById('seed').value = ''
				
				newAddresses(password);
				setWeb3Provider(global_keystore);
				
				//getBalances();
        })
      }

      function newWallet(extraEntropy) {            
        var randomSeed = lightwallet.keystore.generateRandomSeed(extraEntropy);
		
		
		if(supports_html5_storage()) {
			window.localStorage.setItem("seed",randomSeed);		
		}
		
        var password=$('#pwd').val();

        lightwallet.keystore.deriveKeyFromPassword(password, function(err, pwDerivedKey) {

        global_keystore = new lightwallet.keystore(
          randomSeed,
          pwDerivedKey);
                
        newAddresses(password);
        setWeb3Provider(global_keystore);
        //getBalances();
        })
      }

      function showSeed() {
        var password = prompt('Enter password to show your seed. Do not let anyone else see your seed.', 'Password');

        lightwallet.keystore.deriveKeyFromPassword(password, function(err, pwDerivedKey) {
        var seed = global_keystore.getSeed(pwDerivedKey);
        alert('Your seed is: "' + seed + '". Please write it down.')
        })
      }

      function sendEth() {
        var fromAddr = document.getElementById('sendFrom').value
        var toAddr = document.getElementById('sendTo').value
        var valueEth = document.getElementById('sendValueAmount').value
        var value = parseFloat(valueEth)*1.0e18
        var gasPrice = 50000000000
        var gas = 50000
        web3.eth.sendTransaction({from: fromAddr, to: toAddr, value: value, gasPrice: gasPrice, gas: gas}, function (err, txhash) {
          console.log('error: ' + err)
          console.log('txhash: ' + txhash)
        })
      }

      function functionCall() {
        var fromAddr = document.getElementById('functionCaller').value
        var contractAddr = document.getElementById('contractAddr').value
        var abi = JSON.parse(document.getElementById('contractAbi').value)
        var contract = web3.eth.contract(abi).at(contractAddr)
        var functionName = document.getElementById('functionName').value
        var args = JSON.parse('[' + document.getElementById('functionArgs').value + ']')
        var valueEth = document.getElementById('sendValueAmount').value
        var value = parseFloat(valueEth)*1.0e18
        var gasPrice = 50000000000
        var gas = 3141592
        args.push({from: fromAddr, value: value, gasPrice: gasPrice, gas: gas})
        var callback = function(err, txhash) {
          console.log('error: ' + err)
          console.log('txhash: ' + txhash)
        }
        args.push(callback)
        contract[functionName].apply(this, args)
      }
	  
	var web3 = new Web3();
	setWeb3Provider(global_keystore);	