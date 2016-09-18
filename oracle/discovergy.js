Error.stackTraceLimit = Infinity;
var Web3 = require('web3');
var fs = require('fs');
var http = require('http');
var Wallet = require("ethers-wallet");
var request = require('urllib-sync').request;

deployment=JSON.parse(fs.readFileSync("../gsi/js/current.deployment.json"));
gsi_abi=JSON.parse(fs.readFileSync("../gsi/build/GSI.abi"));
var pk=fs.readFileSync("../../pk").toString();
gsi = {};


function doOracleDay(orcalizefor,meterId,dtime,plz) {    
	var d = new Date(dtime);
	d.setTime(dtime);
	console.log(orcalizefor,meterId,d.toLocaleString());	
	day = d.getDate();
	month = d.getMonth()+1;
	year = d.getYear()+1900;
	
	console.log(day,month,year);
	var readings=null;
	
    var res = request('https://microdao.stromhaltig.de/gsi/?meterId='+meterId+'&day='+day+'&month='+month+'&year='+year);		
	readings=JSON.parse(res.data).result;
	var t1=0;	
	var t2=0;
	var gsi=0;
	
	for(var i=0;i<readings.length;i++) {
					readings[i].reading=(readings[i].energy+"").substring(0,(readings[i].energy+"").length-7);					
					if(t2-t1>3600) t1=t2;
					t2=(readings[i].time)/1000;
					if((t2-t1>3600)&&(t1>0)) {		
					
						var res2 = request('https://mix.stromhaltig.de/gsi/json/json_avg.php?plz='+plz+'&t1='+t1+'&t2='+t2);	
						if(!res2.data) throw "No DATA";
						gsiv = JSON.parse(res2.data);
						gsi=gsiv.gsi;
					}
					if(gsi>0) readings[i].gsi=gsi;
					//console.log(new Date(readings[i].time).toLocaleString(),readings[i].reading);
	}				
	for(var i=1;i<readings.length;i++) {
		if(readings[i].time>lastReading) {
			lastReading=readings[i].time;
			var distr=readings[i].reading-readings[i-1].reading;
			var gsi_val=readings[i].gsi-0.5;
			gsi_val*=1;
			gsi_val*=distr;				
			if(gsi_val>0) {
				green_tokens+=gsi_val;			
			} else if(gsi_val<0) {
				grey_tokens+=(-1)*gsi_val;
			}
			
		}
	}
	
	console.log(green_tokens,grey_tokens);
}

gsi.wallet = new Wallet(pk, new Wallet.providers.EtherscanProvider({testnet: false}));
gsi.contract =gsi.wallet.getContract(deployment.gsi, gsi_abi);

var processFor=process.argv[2];
var meterId=process.argv[3];
var plz=process.argv[4];

var lastReading=0;

try {
	lastReading=fs.readFileSync("last_read_"+processFor+".json");
} catch(e) {}



//console.log("Oracle Service on ",gsi.wallet.address);
//doOracle(o4);
var green_tokens=0;
var grey_tokens=0;
doOracleDay(processFor,meterId,(new Date().getTime())-86400000,plz);
doOracleDay(processFor,meterId,(new Date().getTime()),plz);
fs.writeFileSync("last_read_"+processFor+".json",lastReading);
if(green_tokens>0) {
	gsi.contract.mintGreen(processFor,Math.round(green_tokens)).then(function(e,r) { console.log(e,r);});
}
if(grey_tokens>0) {
	gsi.contract.mintGrey(processFor,Math.round(grey_tokens)).then(function(e,r) { console.log(e,r);});
}

console.log(meterId,green_tokens,grey_tokens);
