let locationChangeInUse = false;

function addLocationChangeEvents() {
  if (locationChangeInUse) return;
  locationChangeInUse = true;

  window.history.pushState = ( f => function pushState(this: any){
    var ret = f.apply(this, arguments as unknown as Parameters<typeof window.history.pushState>);
    window.dispatchEvent(new Event('pushstate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  })(window.history.pushState);
  
  window.history.replaceState = ( f => function replaceState(this: any){
    var ret = f.apply(this, arguments as unknown as Parameters<typeof window.history.replaceState>);
    window.dispatchEvent(new Event('replacestate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  })(window.history.replaceState);
  
  window.addEventListener('popstate',()=>{
    window.dispatchEvent(new Event('locationchange'))
  });
}

addLocationChangeEvents();

export {}