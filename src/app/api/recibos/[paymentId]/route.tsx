import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getReciboData } from "@/lib/recibo/data";
import { ReciboPdf } from "@/lib/recibo/recibo-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params;
  if (!paymentId) {
    return NextResponse.json({ error: "Payment id requerido" }, { status: 400 });
  }

  const data = await getReciboData(paymentId);
  if (!data) {
    return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";

  const pdfBuffer = await renderToBuffer(<ReciboPdf data={data} />);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="recibo-${data.numeroRecibo}.pdf"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
