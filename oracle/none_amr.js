Error.stackTraceLimit = Infinity;
var Web3 = require('web3');
var fs = require('fs');
var http = require('http');
var wallet = required('ethers-wallet');

deployment=JSON.parse(fs.readFileSync("../gsi/js/current.deployment.json"));
gsi_abi=JSON.parse(fs.readFileSync("../gsi/build/GSI.abi"));


function doOracle(orcalizefor) {
	console.log("Oracalize For",orcalizefor);	
	lastReading=gsi.lastReading(orcalizefor)[1].c[0];
	requestReading=gsi.requestReading(orcalizefor)[1].c[0];
	console.log(lastReading,requestReading);
	if(lastReading!=0) {
		var distr=requestReading-lastReading;
		if(distr==0) return;
		if(distr>25000) return; // Hack against Mass Token Minding ... 25kwh per Day Max
		// HTTP Request http://mix.stromhaltig.de/gsi/json/json_avg.php?plz=69256&t1=
		var options = {
			host: 'mix.stromhaltig.de',
			port: 80,
			path: '/gsi/json/json_avg.php?plz='+gsi.requestReading(orcalizefor)[2]+'&t1='+(gsi.lastReading(orcalizefor)[0].c[0])
		};
		console.log(options);
		http.request(options, function(response) {
			var str = ''
			  response.on('data', function (chunk) {
				str += chunk;
			  });

			  response.on('end', function () {
				var gsi_obj=JSON.parse(str);
				if(gsi_obj.gsi) {
						var gsi_val=gsi_obj.gsi-0.5;
						gsi_val*=10;
						gsi_val*=distr;
						console.log("Oracle",orcalizefor,gsi_val);
						if(gsi_val<0) {
							gsi.mintGrey(orcalizefor,Math.round(gsi_val*(-1)),{from:web3.eth.accounts[0],gas: 2000000},function(e,r) { console.log(e,r);});
						} else {
							gsi.mintGreen(orcalizefor,Math.round(gsi_val),{from:web3.eth.accounts[0],gas: 2000000},function(e,r) { console.log(e,r);});
						}	
				}
			  });
		}).end();
	} else {
		console.log("Init-Mint Green");
	}
	console.log("Commit Reading",orcalizefor,gsi.requestReading(orcalizefor)[0].c[0],gsi.requestReading(orcalizefor)[1].c[0],gsi.requestReading(orcalizefor)[2]);
	gsi.commitReading(orcalizefor,gsi.requestReading(orcalizefor)[0].c[0],gsi.requestReading(orcalizefor)[1].c[0],gsi.requestReading(orcalizefor)[2],{from:web3.eth.accounts[0],gas: 2000000},function(e,r) { console.log(e,r);});	
}

var gsi = web3.eth.contract(gsi_abi).at(deployment.gsi);
console.log("Bootstrapping");
lastBlock=1900000;
try {
	lastBlock=JSON.parse(fs.readFileSync("lastBlock.json"));
	console.log("Starting from",lastBlock);
} catch(e) {}

var event = gsi.OracleRequest({},{fromBlock:lastBlock},function(e,r) {	
	doOracle(r.args.target);
	fs.writeFileSync("lastBlock.json",JSON.stringify(r.blockNumber));	
	console.log("event()",r.args.target,r.blockNumber);
});


	