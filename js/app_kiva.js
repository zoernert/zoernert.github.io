var call_delay=10000;
var lending_contract='0x9707F3C9ca3C554A6E6d31B71A3C03d7017063F4';

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&.');
};

gsi = {};
gsi.obj = [];
calls = [];
gsi.logs = [];
gsi.gas=20000;

function addLogMsg(tom,msg) {
	var logmsg = {}
	logmsg.msg = msg;
	logmsg.time = new Date().getTime();
	logmsg.tom = tom;	
	gsi.logs.push(logmsg);
	$('#logTab').empty();
	for(var i=0;i<gsi.logs.length;i++) {
		var html="";
		html="<tr><td>";
		if(gsi.logs[i].tom=="info") {
			html+="<span class='label label-info'>Info</span>";		
		}
		if(gsi.logs[i].tom=="error") {
			html+="<span class='label label-danger'>Fehler</span>";		
		}
		html+="</td><td>";
		html+=new Date(gsi.logs[i].time).toLocaleString();
		html+="</td><td>";
		html+=gsi.logs[i].msg;
		html+="</td></tr>";
		$(html).prependTo('#logTab');	
	}
	$('#alerter').show();
} 
function openingWallet() {		
	$.getJSON("./js/current.deployment.json",function(data) {
		gsi.deployment=data;	
		$('#loadETH').attr('href','https://anycoindirect.eu/de/kaufen/ethers?discref=6c25dccb-1272-4668-8219-708427b66c39&address='+gsi.address);	
		$('#recAddr').html(gsi.address);
		$.getJSON("http://api.kivaws.org/v1/lenders/stromhaltig/loans.json",function(kiva) {
				var html="<tr><th>Land</th><th>Kreditnehme</th><th>Für</th></tr>";
				for(var i=0;i<5;i++) {					
					var loan=kiva.loans[i];
					html+="<tr>";
					html+="<td>"+loan.location.country+"</td>";
					html+="<td><a href='https://www.kiva.org/lend/"+loan.id+"' target='_blank'>"+loan.name+"</a></td>";
					html+="<td>"+loan.use+"</td>";
					html+="</tr>";
				}
				$('#lendtab').html(html);
		});
		$.getJSON("./build/GSI.abi",function(abi_code) {
			gsi.obj.GSI = gsi.wallet.getContract(gsi.deployment.gsi,abi_code);
			$.getJSON("./build/GSIToken.abi",function(token_abi) {
				gsi.obj.GSI.greenToken().then(function(r) {		
						gsi.obj.greenToken=gsi.wallet.getContract(r[0],token_abi);
						gsi.obj.greenToken.balanceOf(gsi.address).then(function(v) {
							$('.balance-green').html((v.toString()*1).format());
							$('#sendTokens').attr('placeholder','Max: '+(v.toString()*1));							
						});
						gsi.obj.greenToken.balanceOf(lending_contract).then(function(v) {
							$('.balance-lend').html((v.toString()*1).format());
							var perc=Math.round((1/2500)*(v.toString()*1));
							$('#plend').html(perc+" %");
							$('#plend').attr('aria-valuenow',perc);
							$('#plend').css('width',perc+"%");
							console.log(perc);
						});
				});	
				gsi.obj.GSI.greyToken().then(function(r) {		
						gsi.obj.greyToken=gsi.wallet.getContract(r[0],token_abi);
						gsi.obj.greyToken.balanceOf(gsi.address).then(function(v) {
							$('.balance-gray').html((v.toString()*1).format());
						});
				});	
				gsi.wallet.getBalance().then(function(r) {
						$('#ethbalance').html((r.toString().substr(0,r.toString().length-6)/10000).format());
						if((r.toString().substr(0,r.toString().length-6)/10000)<10000+gsi.gas) {
							if(!gsi.hasBalanceError) {
							addLogMsg('error','<strong>Guthaben für Transaktionen zu nieder.</strong><br/> Aufladung notwendig, um Zählerstand zu aktualisieren, Postleitzahl zu setzen oder Jetons zu transferieren. Bitte wenden Sie sich an Ihren Messstellenbetreiber für weitere Informationen zur Aufladung und Freischaltung von Transaktionen.');							
							gsi.hasBalanceError=true;
							}
						} 
				});			
				$('.gsiactive').html(gsi.address.substr(0,30)+"...");
				$('.gsiactive').attr('title',gsi.address);
				gsi.obj.GSI.lastReading(gsi.address).then(function(r) {
					console.log(r);
					if(r[2].length==5) {
						$('#requestedPLZ').val(r[2]);
						$('#requestedPLZ').attr('disabled','true');
						$('#gsiimg').attr('src','http://mix.stromhaltig.de/gsi/nachhaltig/img/'+r[2]+'.png');
						$('#gsiimg').show();
						gsi.plz=r[2];
					}
				});
				gsi.obj.GSI.requestReading(gsi.address).then(function(r) {
					console.log(r);
					if(r[2].length==5) {
						$('#requestedReading').val(r[1].toString());
						$('#requestedPLZ').val(r[2]);
						$('#requestedPLZ').attr('disabled','true');
						$('#gsiimg').attr('src','http://mix.stromhaltig.de/gsi/nachhaltig/img/'+r[2]+'.png');
						$('#gsiimg').show();
						gsi.plz=r[2];
					}
				});
				gsi.obj.GSI.requiredGas().then(function(x) {gsi.gas=x[0].toString()*1;});
			});
		});
	});
	$('#doRequest').click(function() {
		$('#doRequested').attr('disabled','true');
		if($('#requestedPLZ').val()!=gsi.plz) {
			if($('#requestedPLZ').val().length==5) {
				gsi.obj.GSI.setPlz($('#requestedPLZ').val()).then(function(e) {console.log(e);
				addLogMsg('info','<strong>Transaktion '+e+' gesendet.</strong><br/> Der Status der Verarbeitung kann bei <a href="http://etherscan.io/tx/'+e+'" target="_blank">Etherscan.io</a> kontrolliert werden.');				
				});
			} else {
				addLogMsg('error','<strong>Postleitzahl ungühltig</strong><br/>Es können nur Postleitzahlen in Deutschland verwendet werden.');				
			}
		}
		var options = {
			value:gsi.gas
		};
		gsi.obj.GSI.oracalizeReading($('#requestedReading').val()*1,options).then(function(e)  {			
			addLogMsg('info','<strong>Transaktion '+e+' gesendet.</strong><br/> Der Status der Verarbeitung kann bei <a href="http://etherscan.io/tx/'+e+'" target="_blank">Etherscan.io</a> kontrolliert werden.');
			$('#doRequested').attr('disabled','false');	
		});
	});
	$('#doSend').click(function() {
		var options = {			
			value:0
		};
		gsi.obj.greenToken.transfer(lending_contract,$('#sendTokens').val()*1,options).then(function(e) {
			addLogMsg('info','<strong>Transaktion '+e+' gesendet.</strong><br/> Der Status der Verarbeitung kann bei <a href="http://etherscan.io/tx/'+e+'" target="_blank">Etherscan.io</a> kontrolliert werden.');
			$('#sendTo').val("");
			$('#sendTokens').val("");
		});	
	});	
	if(!gsi.c) {
	gsi.c=setInterval(function() {
									openingWallet();
								},60000);
	}
}
var isNew=false;

function unlockedWallet() {
	$('#closedWallet').hide();
	openingWallet();
	$('#openWallet').show();
}
function doNew() {

					var pk = window.localStorage.getItem("pk");					
					var array = new  Uint16Array(32);
					var pk = new Wallet.utils.Buffer(window.crypto.getRandomValues(array));
					
					gsi.wallet = new Wallet(pk, new Wallet.providers.EtherscanProvider({testnet: false}));
					window.localStorage.setItem("address",gsi.wallet.address); 					
					window.localStorage.setItem("pk",gsi.wallet.privateKey);					

					
					gsi.address=gsi.wallet.address;
					unlockedWallet();
							

}

function unlockIt() {
	gsi.address=$('#seedIn').val();
	if($('#seedIn').val()==window.localStorage.getItem("address")) {				
		gsi.wallet=new Wallet(window.localStorage.getItem("pk"), new Wallet.providers.EtherscanProvider({testnet: false}));
	}			
	console.log(gsi.address);
	unlockedWallet();
}
$(document).ready( 
	function() {
		var seed=window.localStorage.getItem("address");
		var pk=window.localStorage.getItem("pk");		
		if(seed) {
			$('#seedIn').val(seed);				
			$('#hasID').show();
			setTimeout(function() {unlockIt();},1000);
		}  else {
			$('#hasID').hide();
			doNew();
		}
		
		
		$('#closedWallet').show();
		
		$('#doOpen').click(function() {
			unlockIt();
		});
		$('#doImport').click(function() {
			window.localStorage.setItem("pk",$('#keyIn').val());
			gsi.wallet=new Wallet(window.localStorage.getItem("pk"), new Wallet.providers.EtherscanProvider({testnet: false}));
			window.localStorage.setItem("address",gsi.wallet.address);
			gsi.address=gsi.wallet.address;
			unlockedWallet();
		});
		$('#doNew').click(function() {
			doNew();
		});
	}	
);
	 