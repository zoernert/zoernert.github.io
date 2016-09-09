var call_delay=10000;

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&.');
};

gsi = {};
gsi.obj = [];
calls = [];
gsi.logs = [];
gsi.gas=20000;
gsi.data = {};

function $_GET(param) {
	var vars = {};
	window.location.href.replace( location.hash, '' ).replace( 
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if ( param ) {
		return vars[param] ? vars[param] : null;	
	}
	return vars;
}
 
function openingWallet() {		
	$.getJSON("./js/current.deployment.json",function(data) {
		gsi.deployment=data;	
		$('#loadETH').attr('href','https://anycoindirect.eu/de/kaufen/ethers?discref=6c25dccb-1272-4668-8219-708427b66c39&address='+gsi.address);	
		$('#recAddr').html(gsi.address);
		$.getJSON("./build/GSI.abi",function(abi_code) {
			gsi.obj.GSI = gsi.wallet.getContract(gsi.deployment.gsi,abi_code);
			$.getJSON("./build/GSIToken.abi",function(token_abi) {
				gsi.obj.GSI.greenToken().then(function(r) {		
						gsi.obj.greenToken=gsi.wallet.getContract(r[0],token_abi);
						gsi.obj.greenToken.balanceOf(gsi.address).then(function(v) {
							gsi.data.green=v.toString()*1;	
							$('.balance-green').html((v.toString()*1).format());
							$('#sendTokens').attr('placeholder','Max: '+(v.toString()*1));		
								gsi.obj.GSI.greyToken().then(function(r) {		
									gsi.obj.greyToken=gsi.wallet.getContract(r[0],token_abi);
									gsi.obj.greyToken.balanceOf(gsi.address).then(function(v) {
										gsi.data.grey=v.toString()*1;
										$('.balance-grey').html((v.toString()*1).format());
										gsi.data.alltokens=gsi.data.grey+gsi.data.green;
										var p=Math.round(((1/gsi.data.alltokens)*gsi.data.green)*100);
										$('.mixbar').html(p+"%");
										$('.mixbar').attr('aria-valuenow',p);
										$('.mixbar').width(p+"%");
										console.log("%",p);
									});
							});	
						});
				});	
			
				//mixbar
				gsi.wallet.getBalance().then(function(r) {
						$('.ethbalance').html((r.toString().substr(0,r.toString().length-6)/10000).format());	
				});
				console.log("GSI Address",gsi.address);				
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
			});
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
	openingWallet();	
}
function doNew() {
					var pk = window.localStorage.getItem("pk");					
					var array = new  Uint16Array(32);
					var pk = new Wallet.utils.Buffer(window.crypto.getRandomValues(array));
					
					gsi.wallet = new Wallet(pk, new Wallet.providers.EtherscanProvider({testnet: false}));
					window.localStorage.setItem("address",gsi.wallet.address); 					
					window.localStorage.setItem("pk",gsi.wallet.privateKey);					

					gsi.address=gsi.wallet.address;					
}

function skeletonWidget(title,pclass,innerHTML) {
    var html="";
	html+='<div class="panel '+pclass+'" style="">';
	html+='<div class="panel-heading">';
	html+='<h4 class="panel-title">'+title+'</h4></div>';						
	html+='<div class="panel-body">';					  				
	html+=innerHTML;
	html+='</div>';
	html+='</div>';
	return html;
}
function sekeletonEthBanlance() {	
	return skeletonWidget('Guthaben f&uuml;r Transaktionen','panel-primary','<h3>&nbsp;<span class="glyphicon glyphicon-asterisk">&nbsp;</span><span class="ethbalance"></span> WEI (Gas) </h3>');
}
function sekeletonGreenBanlance() {	
	return skeletonWidget('Guthaben Gr&uuml;nStrom','panel-success','<h2><span class="glyphicon glyphicon-leaf">&nbsp;</span><span class="balance-green"></span> Jetons</h2>');
}
function sekeletonGreyBanlance() {	
	return skeletonWidget('Guthaben GrauStrom','panel-default','<h2><span class="glyphicon glyphicon-fire">&nbsp;</span><span class="balance-grey"></span> Jetons</h2>');
}

function sekeletonMixBanlance() {	
	return skeletonWidget('Gr&uuml;nStrom Bilanz (Entnahme)','panel-success','<div class="progress"><div class="progress-bar mixbar progress-bar-success" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style=""width: 0%;">0%</div></div>');
}
$(document).ready( 
	function() {
		var seed=window.localStorage.getItem("address");
				
		if(!window.localStorage.getItem("pk")) {				
			doNew();
		}	else {			
			gsi.wallet=new Wallet(window.localStorage.getItem("pk"), new Wallet.providers.EtherscanProvider({testnet: false}));			
			gsi.address=gsi.wallet.address;	
		}
		if($_GET("a")) {		
			gsi.address=$_GET("a");
		}				
		unlockedWallet();		
		widgets=[];
		if($_GET("w")) {
				var w=$_GET("w").split(",");
				for(var i=0;i<w.length;i++) {
					widgets.push(w[i]);
				}
		} else {
			widgets.push("ethbalance");
		}
		var html="";
		for(var i=0;i<widgets.length;i++) {
			if(widgets[i]=="ethbalance") { html+=sekeletonEthBanlance(); }
			if(widgets[i]=="green") { html+=sekeletonGreenBanlance(); }
			if(widgets[i]=="grey") { html+=sekeletonGreyBanlance(); }
			if(widgets[i]=="mix") { html+=sekeletonMixBanlance(); }			
		}
		$('#widgets_content').html(html);
	}	
);
	 