// jquery.jsonp 1.0.6 (c)2009 Julian Aubourg | MIT License
// http://code.google.com/p/jquery-jsonp/
(function(b){var d=function(g){return g!==undefined&&g!==null},a=b("head"),f={},e={callback:"C",url:location.href},c=function(H){H=b.extend({},e,H);var Q=H.beforeSend;if(d(Q)){var I=0;H.abort=function(){I=1};if(Q(H,H)===false||I){return H}}var h="",l="&",o="?",J="success",w="error",z=H.success,D=H.complete,M=H.error,x=H.dataFilter,y=H.callbackParameter,L=H.callback,v=H.cache,B=H.pageCache,n=H.url,S=H.data,N=H.timeout,C=function(i){setTimeout(i,1)},E,r,P,O;n=d(n)?n:h;S=d(S)?((typeof S)=="string"?S:b.param(S)):h;d(y)&&(S+=(S==h?h:l)+escape(y)+"=?");!v&&!B&&(S+=(S==h?h:l)+"_"+(new Date()).getTime()+"=");E=n.split(o);if(S!=h){r=S.split(o);O=E.length-1;O&&(E[O]+=l+r.shift());E=E.concat(r)}P=E.length-2;P&&(E[P]+=L+E.pop());var A=E.join(o),g=function(i){d(x)&&(i=x(i));d(z)&&z(i,J);d(D)&&D(H,J)},F=function(i){d(M)&&M(H,i);d(D)&&D(H,i)},t=f[A];if(B&&d(t)){C(function(){if(d(t.e)){F(w)}else{g(t.s)}});return H}var k=b("<iframe />").appendTo(a),K=k[0],G=K.contentWindow||K.contentDocument,m=G.document,q=0,s,p=function(i,j){B&&!d(j)&&(f[A]={e:1});s();F(d(j)?j:w)},R=function(j){G[j]=undefined;try{delete G[j]}catch(i){}},u=L=="E"?"X":"E";if(!d(m)){m=G;G=m.getParentNode()}m.open();G[L]=function(i){q=1;B&&(f[A]={s:i});C(function(){s();g(i)})};G[u]=function(i){(!i||i=="complete")&&!q++&&C(p)};H.abort=s=function(){R(u);R(L);m.open();m.write(h);m.close();k.remove()};C(function(){m.write(['<html><head><script src="',A,'" onload="',u,'()" onreadystatechange="',u,'(this.readyState)"><\/script></head><body onload="',u,'()"></body></html>'].join(h));m.close();N>0&&setTimeout(function(){!q&&p(h,"timeout")},N)});return H};c.setup=function(g){b.extend(e,g)};b.jsonp=c})(jQuery);