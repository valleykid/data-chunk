var async = require('async'), data_chunk = {};
var aps = Array.prototype.slice, opt = Object.prototype.toString;
var _hasItem = function(arr, item){ return ~arr.indexOf(item); };

var getFun = function(n, tasks){
	var fun, f, isArr = Array.isArray(tasks[n]);
	if(isArr){
		var lastIndex = tasks[n].length - 1;
		fun = tasks[n][lastIndex];
	} else {
		fun = tasks[n];
	}

	f = function(){
		//console.log(n, tasks[n]);
		var as = aps.call(arguments), cb = as[as.length-1], _cb;
		_cb = function(){
			var argus = aps.call(arguments), v = argus[1],
				arr = argus.concat(), data,
				res = data_chunk.response();
			//console.log(n, argus[1]);
			arr.shift();
			if(!isNaN(n)){
				data_chunk.__index_++;
				n = 'anonym' + data_chunk.__index_;
			}
			if(arr.length>1){
				data = {dcname:n, results:arr};
			} else {
				if(opt.call(v)==='[object Object]'){
					v.dcname = n;
					data = v;
				} else {
					data = {dcname:n, results:v};
				}
			}
			res && data_chunk.writeData(res, data);
			cb && cb.apply(data_chunk, argus);
		};

		as[as.length-1] = _cb;
		fun.apply(data_chunk, as);
	};

	if(isArr){
		tasks[n][lastIndex] = f;
		return tasks[n];
	}
	return f;
};

for(var key in async){
	var fn = async[key];
	data_chunk[key] = fn;
	if(_hasItem(['series', 'parallel', 'parallelLimit', 'waterfall', 'auto'], key)){
		data_chunk['dc'+key] = (function(exec, k){
			return function(){
				var argus = aps.call(arguments),
					callback = argus[argus.length-1],
					tasks = argus[0], o;
				//console.log(k, argus);
				if(Array.isArray(tasks)){
					o = [];
					for(var i=0, l=tasks.length; i<l; i++){
						o.push(getFun(i, tasks));
					}
				} else {
					o = {};
					for(var m in tasks){
						o[m] = getFun(m, tasks);
					}
				}
				argus[0] = o;
				argus[argus.length-1] = function(){
					var res = data_chunk.response(), params = aps.call(arguments);
					res && res.end();
					callback && callback.apply(data_chunk, params);
				};
				exec.apply(data_chunk, argus);
			};
		}(fn, key));
	}
}
data_chunk.response = function(v){
	if(v){
		data_chunk.__curres_ = opt.call(v)==='[object Object]'? v : null;
		data_chunk.__index_ = 0;
	} else {
		return data_chunk.__curres_;
	}
};
data_chunk.writeData = function(res, data){
	data = JSON.stringify(data);
	res.write(['<script>',
		'var root = window;',
		'if(root.ICAT && ICAT.dataChunk){',
			'ICAT.dataChunk(', data, ')',
		'}else{',
			'root.PAGEDATA = root.PAGEDATA || {};',
			';(function(data, dcname, node){',
				'data = data || {};',
				'dcname = data.dcname;',
				'if(dcname){',
					'root.PAGEDATA[dcname] = data;',
					'delete data.dcname;',
				'}',
			'})(', data, ')',
		'}',
	'</script>'].join(''));
};

//console.log(data_chunk);

module.exports = data_chunk;