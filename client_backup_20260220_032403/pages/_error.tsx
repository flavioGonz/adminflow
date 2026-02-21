import { NextPageContext } from "next";

type ErrorProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <html lang="es">
      <body>
        <h1>
          {statusCode
            ? `Error ${statusCode}`
            : "Ocurrió un error en el servidor"}
        </h1>
      </body>
    </html>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res?.statusCode ?? err?.statusCode;
  return { statusCode };
};

export default ErrorPage;
