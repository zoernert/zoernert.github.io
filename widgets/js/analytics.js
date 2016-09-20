// 

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

function loadTxs() {
	var topic2="";
	if(gsi.address.length>0) {
		gsi.address_short=gsi.address.substr(2);
		topic2="&topic2=0x000000000000000000000000"+gsi.address_short;
	}
	$.getJSON("https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=2000000&toBlock=latest&address=0x55e7c4a77821d5c50b4570b08f9f92896a25e012&apikey=IQJR9M4HS96MG4716XN8BB33DAF8B668SI"+topic2,function(d) {			
			gsi.green = d.result.reverse();
			if(gsi.green.length>1) {
				$.getJSON("https://api.etherscan.io/api?module=block&action=getblockreward&blockno="+parseInt(gsi.green[gsi.green.length-1].blockNumber,16)+"&apikey=IQJR9M4HS96MG4716XN8BB33DAF8B668SI",function(d) {						
						gsi.green_startTime=d.result.timeStamp;
				} );
				$.getJSON("https://api.etherscan.io/api?module=block&action=getblockreward&blockno="+parseInt(gsi.green[0].blockNumber,16)+"&apikey=IQJR9M4HS96MG4716XN8BB33DAF8B668SI",function(d) {
						gsi.green_endTime=d.result.timeStamp;
				} );			
			
			var c = setInterval(function() {
				if((gsi.green_startTime)&&(gsi.green_endTime)) {
							clearInterval(c);
							var timeDelta=gsi.green_endTime-gsi.green_startTime;
							var blockDelta=parseInt(gsi.green[0].blockNumber,16)-parseInt(gsi.green[gsi.green.length-1].blockNumber,16);
							gsi.blockTime=timeDelta/blockDelta;
							for(var i=0;i<gsi.green.length;i++) {
								gsi.green[i].timeStamp=Math.round(((gsi.green_startTime*1)+((parseInt(gsi.green[i].blockNumber,16)-parseInt(gsi.green[gsi.green.length-1].blockNumber,16))*gsi.blockTime))*1000);
								gsi.green[i].time=new Date(gsi.green[i].timeStamp);							
								gsi.green[i].timeGMT=new Date(gsi.green[i].timeStamp).toGMTString();
								gsi.green[i].value=parseInt(gsi.green[i].data,16);
							}
							gsi.state.green=true;
				} else {
			
				}								
			},500);
			} else { gsi.state.green=true; }
	});
	
	$.getJSON("https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=2000000&toBlock=latest&address=0x28d5113fb69ccad891cb1f88530b7bcf44225da6&apikey=IQJR9M4HS96MG4716XN8BB33DAF8B668SI"+topic2,function(d) {
			gsi.grey = d.result.reverse();
			if(gsi.grey.length>1) {
				$.getJSON("https://api.etherscan.io/api?module=block&action=getblockreward&blockno="+parseInt(gsi.grey[gsi.grey.length-1].blockNumber,16)+"&apikey=IQJR9M4HS96MG4716XN8BB33DAF8B668SI",function(d) {
						gsi.grey_startTime=d.result.timeStamp;
				} );
				$.getJSON("https://api.etherscan.io/api?module=block&action=getblockreward&blockno="+parseInt(gsi.grey[0].blockNumber,16)+"&apikey=IQJR9M4HS96MG4716XN8BB33DAF8B668SI",function(d) {
						gsi.grey_endTime=d.result.timeStamp;
				} );			
			
			var c = setInterval(function() {
				if((gsi.grey_startTime)&&(gsi.grey_endTime)) {
							clearInterval(c);
							var timeDelta=gsi.grey_endTime-gsi.grey_startTime;
							var blockDelta=parseInt(gsi.grey[0].blockNumber,16)-parseInt(gsi.grey[gsi.grey.length-1].blockNumber,16);
							gsi.blockTime=timeDelta/blockDelta;
							for(var i=0;i<gsi.grey.length;i++) {
								var blocks=(parseInt(gsi.grey[i].blockNumber,16)-parseInt(gsi.grey[gsi.grey.length-1].blockNumber,16)*1);								
								gsi.grey[i].timeStamp=Math.round(((gsi.grey_startTime*1)+(blocks*gsi.blockTime))*1000);
								gsi.grey[i].time=new Date(gsi.grey[i].timeStamp);							
								gsi.grey[i].timeGMT=new Date(gsi.grey[i].timeStamp).toGMTString();
								gsi.grey[i].value=parseInt(gsi.grey[i].data,16);
							}
							gsi.state.grey=true;
				} else {
			
				}								
				},500);
			} else { gsi.state.grey=true; }	
	});
}
var gsi = {};
gsi.state={};
gsi.address="0x9707f3c9ca3c554a6e6d31b71a3c03d7017063f4";
//gsi.address="0x69718E596943827550f3cb466dD09455544Aa61C";
//gsi.address="";
if($_GET("a")) {
	gsi.address=$_GET("a");
}

$(document).ready( function() {
	loadTxs();	
	var c= setInterval(function() {
		if(gsi.state.green&&gsi.state.grey) {			
			clearInterval(c);
			console.log(gsi);
			var data = new google.visualization.DataTable();
			data.addColumn('datetime', 'Date');
			data.addColumn('number', 'Grün');
			data.addColumn('number', 'Grau');
			
			gsi.green=gsi.green.reverse();
			gsi.grey=gsi.grey.reverse();
			var j=0;
			var t_green=0;
			var t_grey=0;
			for(var i=0;i<gsi.green.length;i++) {										
				if((j<gsi.grey.length)&&(gsi.grey[j].timeStamp<gsi.green[i].timeStamp)) {
						t_grey+=gsi.grey[j].value;						
						//data.addRow([gsi.grey[j].time,t_green,t_grey]);
						if(gsi.grey[j]) {
						$("<tr><td>"+new Date(gsi.grey[j].time).toLocaleString()+"</td><td class='alert alert-default'>+"+gsi.grey[j].value+" GrauStrom</td><td>"+t_green+" ("+Math.round(((1/(t_green+t_grey))*t_green)*100)+"%)</td><td>"+t_grey+"</td></tr>").appendTo("#tbl");
						}
						j++;
						if(i>0) i--;
						
				}  else {				
					if(gsi.green[i]) { 
						t_green+=gsi.green[i].value 					
						data.addRow([gsi.green[i].time,t_green,t_grey]);
						$("<tr><td>"+new Date(gsi.green[i].time).toLocaleString()+"</td><td class='alert alert-success'>+"+gsi.green[i].value+" GrünStrom</td><td>"+t_green+" ("+Math.round(((1/(t_green+t_grey))*t_green)*100)+"%)</td><td>"+t_grey+"</td></tr>").appendTo("#tbl");
					}
				}
				
			}			
			 var options = {
				  title: 'Jeton Performance '+$_GET("a"),
				  hAxis: {title: 'Year',  titleTextStyle: {color: '#333'}},
				  vAxis: {minValue: 0},
				  colors: ['green','gray']
				};				
				var chart = new google.visualization.AreaChart(document.getElementById('widgets_content'));
				chart.draw(data, options);
		} else {
		
		}	
	},500);
});