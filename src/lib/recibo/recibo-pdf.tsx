/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReciboData } from "./data";

// Paleta de marca Solola's
const BRAND = "#1A6BB8";
const BRAND_DARK = "#114676";
const TEXT = "#0a0a0a";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: TEXT,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
  },
  brandBlock: { flexDirection: "column" },
  brandName: {
    fontSize: 22,
    fontWeight: 700,
    color: BRAND_DARK,
    fontFamily: "Helvetica-Bold",
  },
  brandTagline: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: BRAND,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  contactBlock: {
    fontSize: 8.5,
    color: MUTED,
    textAlign: "right",
    lineHeight: 1.4,
  },
  logo: { width: 58, height: 58, objectFit: "contain" },

  reciboTitleRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reciboTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
  },
  reciboNumero: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },

  metaGrid: {
    marginTop: 10,
    flexDirection: "row",
    gap: 16,
  },
  metaCol: { flex: 1 },
  metaLabel: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 9.5,
    color: TEXT,
    marginTop: 1,
  },

  sectionDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: LINE,
  },

  fiscalBlock: {
    marginTop: 10,
    backgroundColor: "#f5f7fb",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  fiscalItem: { width: "48%" },

  itemsHeader: {
    marginTop: 14,
    flexDirection: "row",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    fontSize: 8.5,
  },
  itemsRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  colCant: { width: "10%", textAlign: "center" },
  colDesc: { width: "55%", paddingRight: 8 },
  colPrecio: { width: "15%", textAlign: "right" },
  colNeto: { width: "20%", textAlign: "right" },
  itemDescription: { fontSize: 9.5, color: TEXT },
  itemExtras: { fontSize: 8.5, color: MUTED, marginTop: 2, fontStyle: "italic" },

  totals: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: "55%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: { color: MUTED },
  totalValue: { fontFamily: "Helvetica-Bold", color: TEXT },
  totalGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: BRAND,
    marginTop: 4,
  },
  totalGrandLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
  },
  totalGrandValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },

  footer: {
    marginTop: 22,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LINE,
    textAlign: "center",
  },
  footerThanks: {
    fontSize: 10.5,
    color: BRAND_DARK,
    fontFamily: "Helvetica-Bold",
  },
  footerTagline: {
    fontSize: 8.5,
    color: MUTED,
    marginTop: 2,
  },
});

const formatDOP = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Santo_Domingo",
  }).format(date);
};

export function ReciboPdf({ data }: { data: ReciboData }) {
  return (
    <Document
      title={`Recibo ${data.numeroRecibo} - ${data.cliente.nombre}`}
      author={data.negocio.nombreComercial}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{data.negocio.nombreComercial}</Text>
            <Text style={styles.brandTagline}>{data.negocio.tagline}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <View style={styles.contactBlock}>
              <Text>{data.negocio.direccion}</Text>
              <Text>{data.negocio.correo}</Text>
              <Text>{data.negocio.telefono}</Text>
              {data.negocio.rnc && <Text>RNC: {data.negocio.rnc}</Text>}
            </View>
            {data.negocio.logoUrl && (
              <Image src={data.negocio.logoUrl} style={styles.logo} />
            )}
          </View>
        </View>

        {/* Recibo title */}
        <View style={styles.reciboTitleRow}>
          <Text style={styles.reciboTitle}>Recibo de Pago</Text>
          <Text style={styles.reciboNumero}>No. {data.numeroRecibo}</Text>
        </View>

        {/* Meta grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Fecha / Hora</Text>
            <Text style={styles.metaValue}>{formatDate(data.fecha)}</Text>

            <Text style={[styles.metaLabel, { marginTop: 6 }]}>
              Atendido por
            </Text>
            <Text style={styles.metaValue}>{data.atendidoPor}</Text>

            {data.numeroPedido !== null && (
              <>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>
                  No. Pedido
                </Text>
                <Text style={styles.metaValue}>{data.numeroPedido}</Text>
              </>
            )}
            {data.tema && (
              <>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>Tema</Text>
                <Text style={styles.metaValue}>{data.tema}</Text>
              </>
            )}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Cliente</Text>
            <Text style={styles.metaValue}>{data.cliente.nombre}</Text>

            {data.cliente.rnc && (
              <>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>
                  Cédula / RNC
                </Text>
                <Text style={styles.metaValue}>{data.cliente.rnc}</Text>
              </>
            )}
            {data.cliente.telefono && (
              <>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>
                  Contacto
                </Text>
                <Text style={styles.metaValue}>{data.cliente.telefono}</Text>
              </>
            )}
            {data.cliente.correo && (
              <>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>Correo</Text>
                <Text style={styles.metaValue}>{data.cliente.correo}</Text>
              </>
            )}
          </View>
        </View>

        {/* Fiscal block */}
        {(data.tipoComprobante || data.ncf || data.numeroTransaccion) && (
          <View style={styles.fiscalBlock}>
            {data.tipoComprobante && (
              <View style={styles.fiscalItem}>
                <Text style={styles.metaLabel}>Tipo de comprobante</Text>
                <Text style={styles.metaValue}>{data.tipoComprobante}</Text>
              </View>
            )}
            {data.ncf && (
              <View style={styles.fiscalItem}>
                <Text style={styles.metaLabel}>e-NCF</Text>
                <Text style={styles.metaValue}>{data.ncf}</Text>
              </View>
            )}
            <View style={styles.fiscalItem}>
              <Text style={styles.metaLabel}>Forma de pago</Text>
              <Text style={styles.metaValue}>{data.formaPago}</Text>
            </View>
            {data.numeroTransaccion && (
              <View style={styles.fiscalItem}>
                <Text style={styles.metaLabel}>No. Transacción</Text>
                <Text style={styles.metaValue}>{data.numeroTransaccion}</Text>
              </View>
            )}
          </View>
        )}

        {/* Items */}
        <View style={styles.itemsHeader}>
          <Text style={styles.colCant}>Cant.</Text>
          <Text style={styles.colDesc}>Producto</Text>
          <Text style={styles.colPrecio}>Precio</Text>
          <Text style={styles.colNeto}>Total</Text>
        </View>
        {data.items.map((it, idx) => (
          <View key={idx} style={styles.itemsRow} wrap={false}>
            <Text style={styles.colCant}>{it.cantidad}</Text>
            <View style={styles.colDesc}>
              <Text style={styles.itemDescription}>{it.descripcion}</Text>
              {it.extras && (
                <Text style={styles.itemExtras}>{it.extras}</Text>
              )}
            </View>
            <Text style={styles.colPrecio}>{formatDOP(it.precio)}</Text>
            <Text style={styles.colNeto}>{formatDOP(it.neto)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>RD$ {formatDOP(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ITBIS</Text>
            <Text style={styles.totalValue}>RD$ {formatDOP(data.itbis)}</Text>
          </View>
          <View style={styles.totalGrand}>
            <Text style={styles.totalGrandLabel}>Total</Text>
            <Text style={styles.totalGrandValue}>
              RD$ {formatDOP(data.total)}
            </Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text style={styles.totalLabel}>Recibido</Text>
            <Text style={styles.totalValue}>
              RD$ {formatDOP(data.recibido)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: data.balance > 0 ? "#b45309" : MUTED }]}>
              Balance pendiente
            </Text>
            <Text
              style={
                data.balance > 0
                  ? [styles.totalValue, { color: "#b45309" }]
                  : styles.totalValue
              }
            >
              RD$ {formatDOP(data.balance)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerThanks}>¡Gracias por preferirnos!</Text>
          <Text style={styles.footerTagline}>
            {data.negocio.nombreComercial} · Cocinando momentos memorables
          </Text>
        </View>
      </Page>
    </Document>
  );
}
