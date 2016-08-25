var call_delay=100;
try {
if(!web3) {
	if (typeof web3 !== 'undefined') {
	  web3 = new Web3(web3.currentProvider);
	  call_delay=1000; // Hack to get rid of MetaMask challenges
	} else {  
	  if(Web3) {
		web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	  }
	}
}
} catch(r) {
	$('#alerter').html('<div class="alert alert-danger alert-dismissible" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Verbindung zur Blockchain nicht möglich.</strong><br/>Web3 wurde nicht gefunden. Bitte <a href="https://metamask.io/" target="_blank">MetaMask.io (Browser Erweiterung)</a> installieren, oder MIST-Browser verwenden.</div>');
}
Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&.');
};

gsi = {};
gsi.obj = [];
calls = [];

var call_semaphore=false;


function serialCall() {	
	if((calls.length>0)&&(!call_semaphore)) {
		call_semaphore=true;
		var call=calls.shift();
		
		call.param.push(function(e,r) {			
			call.cb(e,r);			
			call_semaphore=false;
			if(calls.length>0) setTimeout(serialCall,call_delay);
			
		});
		console.log("callSeq",call.param);
		// This is dirty... 
		if(call.param.length==1) {
			call.fnct(call.param[0]);
		}
		if(call.param.length==2) {
			call.fnct(call.param[0],call.param[1]);
		}
		if(call.param.length==3) {
			call.fnct(call.param[0],call.param[1],call.param[2]);
		}
	}
}

function chainCall(fnct,param,cb) {	
	var call = {};
	call.fnct=fnct;
	call.cb=cb;
	call.param=param;
	calls.push(call);
	setTimeout(function() {
		if(!call_semaphore) {
			serialCall();
		}	
	},call_delay);
}

function updateProg() {
	if(gsi.plz.length!=5) return;
	if(gsi.oldplz!=gsi.plz) {
		$('#prog').show();
		$('#progpng').attr('src','https://mix.stromhaltig.de/gsi/preisverlauf/img/'+gsi.plz+'.png');
		gsi.oldplz=gsi.plz;
	}
}
function updateRendition(name) {	
	console.log("updateRendition()",name);
	if(!gsi.address) {
		gsi.address=web3.eth.accounts[0];
	}
	$('#loadETH').attr('href','https://anycoindirect.eu/de/kaufen/ethers?discref=6c25dccb-1272-4668-8219-708427b66c39&address='+gsi.address);
	chainCall(web3.eth.getBalance,[gsi.address],function(e,r) {$('#ethbalance').html(r.c[0]);});
	
	//$('#ethtx').html(Math.round(web3.eth.getBalance(gsi.address).c[0]/(gsi.gasRequired+8000)));
	
	$('.gsiactive').html(gsi.address);
	if(name=="GreenToken") {
			chainCall(
			gsi.obj[name].balanceOf,[gsi.address],function(e,r) {		
				if(!gsi.obj[name]) { 
					updateRendition(name);
					console.log("Async Error");
					return; 
				}
				var event = gsi.obj[name].Transfer();
				$('.balance-green').attr('title','Token Adresse: '+ gsi.obj.GreenToken.address);
				event.watch(function(error, result){						
						$('.balance-green').css('color','#c0c0c0');
						setTimeout(function() {
							updateRendition('GreenToken');
							updateRendition('GSI');
							$('.balance-green').css('color','#ffffff');
							
						},4000);
									
				});
				$('.balance-green').html(r.c[0].format());	
				$('#sendTokens').attr('placeholder',"Max: "+r.c[0]);
			});	
	}
	if(name=="GreyToken") {
			chainCall(
			gsi.obj[name].balanceOf,[gsi.address],function(e,r) {
				if(!gsi.obj[name]) {
					updateRendition(name);
					console.log("Async Error");
					return
				}
				var event = gsi.obj[name].Transfer();
				$('.balance-gray').attr('title','Token Adresse: '+ gsi.obj.GreyToken.address);
				event.watch(function(error, result){	
						$('.balance-gray').css('color','#c0c0c0');
						setTimeout(function() {
							updateRendition('GreyToken');
							updateRendition('GSI');
							$('.balance-gray').css('color','#ffffff');							
						},4000);				
				});
				$('.balance-gray').html(r.c[0].format());				
			});	
	}
	if(name=="GSI") {
			chainCall(
			gsi.obj[name].lastReading,[gsi.address],function(e,r) {
				if(r.length==3) {
					gsi.lastreading=r[0].c[0];
					$('.gsiplz').html(r[2]);					
					$('#requestedPLZ').attr('value',r[2]);
					gsi.plz=r[2];
					updateProg();
					if(r[2].length==5) {
							$('#requestedPLZ').attr('disabled','true');
					}
					$('.gsivalue').html(r[1].c[0].format());
					$('#requestedReading').attr('value',r[1].c[0]);
					$('.gsitime').html(new Date(r[0].c[0]*1000).toLocaleString());
				}						
				if(gsi.requestreading!=gsi.lastreading) {
					$('#gsiwait').html("<strong>Ja!</strong>");
				}	else { $('#gsiwait').html("nein");}				
			});
			chainCall(
			gsi.obj[name].requestReading,[gsi.address],function(e,r) {
				if(r.length==3) {
					gsi.requestreading=r[0].c[0];
					gsi.plz=r[2];
					updateProg();
					$('#requestedPLZ').attr('value',r[2]);
					$('.gsiplz').html(r[2]);
				}			
				if(gsi.requestreading!=gsi.lastreading) {
					$('#gsiwait').html("<strong>Ja!</strong>");
				}	else { $('#gsiwait').html("nein");}						
			});
			chainCall(
			gsi.obj[name].owner,[],function(e,r) {
				$('#tktitle').attr('title',"GSI Owner: "+r);				
			});			
	}
}

function loadInstance(abi,address,name) {
	$.getJSON("./build/"+abi+".abi",function(abi_code) {
			var obj = web3.eth.contract(abi_code).at(address);				
			gsi.obj[name]=obj;					
			updateRendition(name);
			if(name=="GSI") {
				chainCall(gsi.obj.GSI.greenToken,[],function(e,r) {console.log("greenToken()",e,r); if(r.length>3) { loadInstance("GSIToken",r,"GreenToken");} else {call_delay+=200;loadInstance("GSI",gsi.deployment.gsi,"GSI");}});
				chainCall(gsi.obj.GSI.greyToken,[],function(e,r) {console.log("greyToken()",e,r); if(r.length>3) { loadInstance("GSIToken",r,"GreyToken"); } else {call_delay+=200;loadInstance("GSI",gsi.deployment.gsi,"GSI");}});
				chainCall(gsi.obj.GSI.requiredGas,[],function(e,r) {
					console.log("GSI.requiredGas()",e,r);
					gsi.gasRequired=r.c[0];
				});
			}
	});
}
function oracalizeReading() {
				gsi.obj.GSI.oracalizeReading($('#requestedReading').val(),{from:web3.eth.accounts[0],gas: 100000,value:gsi.gasRequired},
					function(e,r) {
						if(e) {
						$('#alerter').html('<div class="alert alert-danger alert-dismissible" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Transaktion kann nicht ausgeführt werden.</strong><br/>Mögliche Ursache:<ul><li>Nicht genügend Gas (Ether)</li><li>Zählerstand kleiner als bereits bestätigter Zählerstand</li><li>Zeit zwischen den Ablesungen zu klein</li></ul></div>');
						console.log(e);
						} else {
						$('#alerter').html('<div class="alert alert-warning alert-dismissible" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>Warte auf Transaktion '+r+' in der Blockchain</div>');
						var c = setInterval(function() {
							web3.eth.getTransactionReceipt(r,function(e,f) {
								 if(f) {
									if(f.blockNumber>0) {
										$('#inlForm').show();
										$('#alerter').hide();
										clearInterval(c);
										//location.reload(false);
									}
								 }
							}); 
						},1000);
						}
						$('.close').click(function(){
							$('#inlForm').show();
						});
						$('#inlForm').hide();
						$('#alerter').show();
					}
				);	
}

function drawTokenChart() {
 $('#txchartrow').show();
 var chart = new google.visualization.LineChart(document.getElementById('txchart'));
 var mdata=[['BlockNumber', 'GreenToken']];
 
 
 var event = gsi.obj.GSI.MintedGreen({},{fromBlock:1900000},function(e,r) {
    var row=[r.blockNumber,r.args.amount.c[0]]; 
	mdata.push(row);
	var data = google.visualization.arrayToDataTable(mdata,false); 	  
	chart.draw(data, {width: 400, height: 240});
  }); 	   
}
function resetCallStack() {
    console.log("ResetCallStack!!!!");
	calls=[];	
	call_semaphore=false;
	gsi.obj = [];
	$.getJSON("./js/current.deployment.json",function(data) {
			gsi.deployment=data;				
			loadInstance('GSI',data.gsi,"GSI");					
	});
   // loadInstance('GSI',gsi.deployment,"GSI");					
}
$(document).ready( 
	function() {		
		$.getJSON("./js/current.deployment.json",function(data) {
			gsi.deployment=data;				
			loadInstance('GSI',data.gsi,"GSI");					
		});
		$('#doRequest').click(function() {
				if($('#requestedPLZ').val().length!=5) return;
				if(gsi.plz!=$('#requestedPLZ').val()) {
					gsi.obj.GSI.setPlz($('#requestedPLZ').val(),{from:web3.eth.accounts[0],gas: 100000,value:gsi.gasRequired},
					function(e,r) {
						oracalizeReading();
					});
				} else {
					oracalizeReading();
				}
				
		});
		$('#doSend').click(function() {
				gsi.obj.GreenToken.transfer($('#sendTo').val(),$('#sendTokens').val(),{from:web3.eth.accounts[0],gas: 100000},
					function(e,r) {
						updateRendition('GSI');
					});
		});
		$('#doRemView').click(function() {
				gsi.address=$('#meterSelect').val();
				resetCallStack();			
		});
		$('#swView').click(function() {
			console.log("CLICK");
			$('#selfView').toggle();$('#remView').toggle();
		});
		$('#loadETH').click(function() {
			$('#loadINFO').toggle();
		});
		setInterval(function() {			
			if((calls.length>1)&&(call_semaphore)) {				
				var old_length=calls.length;
				setTimeout(function()				
				 {
				 	if(calls.length>=old_length) {
						resetCallStack();
					}
				 },call_delay*2);
			}
		},call_delay*10);
});
	 