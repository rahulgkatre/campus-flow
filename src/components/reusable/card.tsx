interface CardProps {

}

export function Card({children}: React.PropsWithChildren<CardProps>) {
  return (
    <div className="p-5 w-full max-w-4xl">
      <div className="rounded-md shadow-md bg-white p-5 flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}