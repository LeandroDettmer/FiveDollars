import type { HttpMethod } from "@/types";

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: "http-method--get",
  POST: "http-method--post",
  PUT: "http-method--put",
  PATCH: "http-method--patch",
  DELETE: "http-method--delete",
};

export function HttpMethodBadge({
  method,
  className,
}: {
  method: HttpMethod;
  className?: string;
}) {
  return (
    <span
      className={`http-method ${METHOD_CLASS[method]}${className ? ` ${className}` : ""}`}
      aria-label={`Método ${method}`}
    >
      {method}
    </span>
  );
}
