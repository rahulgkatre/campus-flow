interface PageProps {

}

export function Page({children}: React.PropsWithChildren<PageProps>) {
  return (
    <div className="bg-yellow-100 h-full flex flex-col items-center">
      {children}
    </div>
  );
}