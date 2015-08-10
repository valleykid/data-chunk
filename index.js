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
					tasks = argus[0], o, func;
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

				callback = opt.call(callback)==='[object Function]'? callback : null;
				func = function(err, results){
					var res = data_chunk.response(),
						params = aps.call(arguments);
					callback && callback.apply(data_chunk, params);
					if(res){
						var temp = data_chunk.__footTemp_;
						if(temp) data_chunk.fragRender(temp);
						res.end(); //console.log(results);
					}
				};
				callback? argus[argus.length-1]=func : argus.push(func);
				exec.apply(data_chunk, argus);
			};
		}(fn, key));
	}
}
data_chunk.response = function(v, footTemp){
	if(v){
		data_chunk.__curres_ = opt.call(v)==='[object Object]'? v : null;
		data_chunk.__index_ = 0;
		data_chunk.__footTemp_ = footTemp;
	} else {
		return data_chunk.__curres_;
	}
};
data_chunk.writeData = function(res, data){
	data = JSON.stringify(data);
	res.write(['\n<script>',
		'var root = window;',
		'if(root.ICAT && ICAT.dataChunk){',
			'ICAT.dataChunk(', data, ')',
		'}else{',
			'root.PAGEDATA = root.PAGEDATA || {};',
			'(function(data, dcname, node){',
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

data_chunk.fragRender = function(name, data, res){
	res = res || this.response();
	if(!res) return;

	var app = res.req.app, engines = app.engines, fn, file,
		ekey = app.get('view engine'),
		key = app.get('__dataKey_'),
		path = app.get('views');
	extend(key? res.locals[key] : res.locals, data);
	ekey = ekey.charAt(0)==='.'? ekey : '.'+ekey;
	fn = engines[ekey];
	file = path + '/' + (~name.indexOf(ekey)? name : name+ekey);
	if(fn){
		fn(file, res.locals, function(err, ret){
			res.write(ret);
		});
	}
};

function extend(obj){
	if (opt.call(obj)!=='[object Object]') return obj;
	var source, prop;
	for(var i=1, length=arguments.length; i<length; i++){
		source = arguments[i];
		for(prop in source){
			obj[prop] = source[prop];
		}
	}
	return obj;
}

//console.log(data_chunk);

module.exports = data_chunk;