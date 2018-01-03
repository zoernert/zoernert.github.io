$.qparams = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURI(results[1]) || 0;
    }
}

function updateCity() {
	var query=$('#query').val();
	if($('#query').attr('data').length>0) {
		query=$('#query').attr('data');	
	}
	$.getJSON("https://stromdao.de/crm/service/tarif/?k=1337&plz="+encodeURI(query),function(data) {
				data.gp=data.gp*12;
				$('.city').html(data.city);
				$('.plz').html(data.plz);
				$('#query').attr('data',data.plz);
				$('#query').val(data.plz+" "+data.city);
				$('.gp').html(data.gp);
				$('.ap').html(data.ap);
				$('#gp').val(data.gp);
				$('#ap').val(data.ap);
				$('#primary_address_city').val(data.city);
				$('#primary_address_postalcode').val($('#plz').val());
				$('#gp').attr('data',data.gp)
				$('#ap').attr('data',data.ap);	
				$('.navinfo').hide();
				$('#calc_row').show();
				$('#sign_row').show();	
				$('#kond_row').show();
				location.href="#tarifrechner";
				_paq.push(['trackGoal',1,0]);
				calcJV();	
			
	});	
}

function calcJV() {
	$('.jv').html($('#jv').val());
	$('.aj').html((($('#ap').val()*$('#jv').val())/100).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }));
	$('.gj').html($('#gp').val());
	$('.tj').html(($('#gp').val()*1+(($('#ap').val()*$('#jv').val())/100)).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }));
	$('.za').html((Math.round(($('#gp').val()*1+(($('#ap').val()*$('#jv').val())/100))/12)+1)+",00 €");
	$('#za').val((Math.round(($('#gp').val()*1+(($('#ap').val()*$('#jv').val())/100))/12)+1));
	_paq.push(['trackGoal',2,0]);
	return false;
}

$('#calcSel').click(calcJV);
$('#jv').change(calcJV);

$('.jvsel').click(function(a,b) {
	$('#jv').val(a.currentTarget.attributes.data.nodeValue);	
	$('.jv').html(a.currentTarget.attributes.data.nodeValue);	
	calcJV();
	return true;
});

function wtl() {
    var data = {};
    $.each($("input"),function(i,v) { data[$(v).attr('id')]=$(v).val(); });
    $.each($("select"),function(i,v) { data[$(v).attr('id')]=$(v).val(); });   
	data.campaign_id="e08e0372-f240-3cf8-1e72-5a4c34b382da";
    data.assigned_user_id="1ca4aab1-1297-e170-c66b-59b531c5ad6e";
    data.moduleDir="Contacts";
    data.lead_source="Campaign";
    data.ap=$('#ap').attr('data');
    data.gp=$('#gp').attr('data');
    data.description=JSON.stringify(data);
    $.post("https://stromdao.de/crm/index.php?entryPoint=WebToPersonCapture",data).done(function(k) {
		_paq.push(['trackGoal',3,0]);
     	console.log("Done");
    });
}
$('#query').on('keyup',function() {
	$('#query').attr('data',"");	
});
$('#qfrm').submit(function(){
updateCity();
return false;	
});	
calcJV();
if($.qparams("query")!=null) {
		$('#query').val($.qparams("query"));
		updateCity();
}
