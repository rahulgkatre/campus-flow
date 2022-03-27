import { Page } from 'components/reusable/page';
import { useCallback, useEffect, useState } from 'react';


export function Test() {
  

  const [locale, setLocale] = useState<string>("en-US");

  const sendRequest = useCallback((localeReq) => {
    // postMessage(localeReq);
    console.log(localeReq);
  }, []);

  // const handleLocaleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
  //   // console.log(event.target.value);
  //   setLocale(event.target.value);
  // }, [setLocale]);

  // locale change effect
  useEffect(() => {
    const request = {
      locale: locale
    };
    sendRequest(request);

    // return () => {
    //   // cleanup related to locale request stuff
    //   console.log('bye');
    // };
  }, [locale, sendRequest]);


  return <Page>
    {/* <textarea name="gay" id="gay" cols={30} rows={10} onChange={(event) => {
      console.log(event.target.value);
      setFormVal(event.target.value);
      }} value={formVal}>
    </textarea> */}
    <select name="sel" id="sel" onChange={event=>setLocale(event.target.value)} value={locale}>
      <option value="en-US">en-US</option>
      <option value="es-US">es-US</option>
    </select>
    <p>{locale}</p>
  </Page>
}