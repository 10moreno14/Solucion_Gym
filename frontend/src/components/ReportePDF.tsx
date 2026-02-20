import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// ESTILOS (CSS para PDF)
const styles = StyleSheet.create({
  page: { 
    paddingTop: 30, 
    paddingBottom: 60, // Espacio para que no se pegue al borde abajo
    paddingHorizontal: 40,
    fontSize: 10, 
    fontFamily: 'Helvetica' 
  },
  
  // ENCABEZADO (Ahora será fijo en todas las páginas)
  header: { 
    flexDirection: 'row', 
    borderBottomWidth: 2, 
    borderBottomColor: '#111', 
    paddingBottom: 10, 
    marginBottom: 20 
  },
  headerLeft: { flex: 1 },
  headerRight: { textAlign: 'right' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  subtitle: { fontSize: 10, color: '#666' },
  
  // SECCIONES
  // wrap: false evita que una sección se parta a la mitad
  section: { 
    marginBottom: 10, 
    padding: 10, 
    border: '1px solid #EEE', 
    borderRadius: 5,
    backgroundColor: '#fff'
  },
  sectionTitle: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    marginBottom: 6, 
    color: '#1F2937', 
    textTransform: 'uppercase', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE', 
    paddingBottom: 4 
  },
  
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 80, fontWeight: 'bold', color: '#4B5563', fontSize: 9 },
  value: { flex: 1, color: '#111', fontSize: 9 },

  // EVIDENCIAS
  evidenceSection: { marginTop: 10 },
  evidenceTitle: { fontSize: 9, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  
  imageGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  
  // CAJA DE IMAGEN INTELIGENTE
  imageBox: { 
    width: '48%', 
    height: 200, // Altura fija buena
    marginBottom: 10, 
    border: '1px solid #DDD', 
    borderRadius: 4,
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 2
  }, 
  
  image: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'contain' // Muestra toda la foto sin recortes
  },
  
  noImage: { fontSize: 8, color: '#CCC' },

  // FIRMAS (Ahora se mueven juntas)
  footerContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  signatureBox: { width: '45%', paddingTop: 5 },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#000', marginTop: 30, marginBottom: 5 },
  signatureText: { fontSize: 8, color: '#333' },
  signatureLabel: { fontSize: 7, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  
  // Número de página
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

interface ReporteData {
  clienteNombre: string;
  direccion: string;
  telefono: string;
  nit: string;
  marca: string;
  modelo: string;
  serial: string;
  tecnicoNombre: string;
  tecnicoCc: string;
  observaciones: string;
  fotosAntes: string[];   
  fotosDespues: string[]; 
  fecha: string;
}

export default function ReportePDF({ data }: { data: ReporteData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ENCABEZADO FIJO: Se repite en cada página automáticamente */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>SOLUCIÓN GYM</Text>
            <Text style={styles.subtitle}>Reporte Técnico de Mantenimiento</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>Fecha: {data.fecha}</Text>
            <Text>Nº Reporte: SG-RTMP-{Math.floor(Math.random() * 10000)}</Text>
          </View>
        </View>

        {/* 1. CLIENTE (wrap={false} evita que se rompa a la mitad) */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>1. Información del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{data.clienteNombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{data.direccion}</Text>
          </View>
          <View style={styles.row}>
             <Text style={styles.label}>Teléfono:</Text>
             <Text style={{...styles.value, width: '40%'}}>{data.telefono}</Text>
             <Text style={styles.label}>NIT:</Text>
             <Text style={styles.value}>{data.nit}</Text>
          </View>
        </View>

        {/* 2. EQUIPO */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>2. Información del Equipo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Equipo:</Text>
            <Text style={styles.value}>{data.modelo || 'Máquina General'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marca:</Text>
            <Text style={{...styles.value, width: '40%'}}>{data.marca}</Text>
            <Text style={styles.label}>Serial:</Text>
            <Text style={styles.value}>{data.serial}</Text>
          </View>
        </View>

        {/* 3. OBSERVACIONES */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>3. Actividades y Observaciones</Text>
          <Text style={{ lineHeight: 1.5, fontSize: 9 }}>
            {data.observaciones || "Se realizó mantenimiento preventivo general. Limpieza, lubricación y ajuste de componentes."}
          </Text>
        </View>

        {/* 4. EVIDENCIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Evidencias Fotográficas</Text>
          
          {/* FOTOS ANTES */}
          <View style={styles.evidenceSection}>
            <Text style={styles.evidenceTitle}>ANTES ({data.fotosAntes.length})</Text>
            <View style={styles.imageGrid}>
              {data.fotosAntes.length > 0 ? (
                data.fotosAntes.map((foto, index) => (
                  // wrap={false} AQUÍ es el truco: Si esta foto no cabe, 
                  // se lleva todo el cuadro a la siguiente página.
                  <View key={`antes-${index}`} style={styles.imageBox} wrap={false}>
                    <Image src={foto} style={styles.image} />
                  </View>
                ))
              ) : (
                <Text style={styles.noImage}>No se registraron fotos</Text>
              )}
            </View>
          </View>

          {/* FOTOS DESPUÉS */}
          <View style={styles.evidenceSection}>
            <Text style={styles.evidenceTitle}>DESPUÉS ({data.fotosDespues.length})</Text>
            <View style={styles.imageGrid}>
              {data.fotosDespues.length > 0 ? (
                data.fotosDespues.map((foto, index) => (
                  <View key={`despues-${index}`} style={styles.imageBox} wrap={false}>
                    <Image src={foto} style={styles.image} />
                  </View>
                ))
              ) : (
                <Text style={styles.noImage}>No se registraron fotos</Text>
              )}
            </View>
          </View>
        </View>

        {/* PIE DE PÁGINA: FIRMAS (Bloque Indivisible) */}
        <View style={styles.footerContainer} wrap={false}>
           <Text style={styles.sectionTitle}>Validación del Servicio</Text>
           <View style={styles.footerRow}>
              
              {/* Firma Técnico */}
              <View style={styles.signatureBox}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>REALIZADO POR:</Text>
                  <Text style={{fontSize: 9, fontWeight: 'bold', marginTop: 2}}>{data.tecnicoNombre}</Text>
                  <Text style={styles.signatureText}>CC: {data.tecnicoCc}</Text>
              </View>

              {/* Firma Cliente */}
              <View style={styles.signatureBox}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>RECIBIDO A SATISFACCIÓN:</Text>
                  <Text style={{fontSize: 9, fontWeight: 'bold', marginTop: 2}}>{data.clienteNombre}</Text>
                  <Text style={styles.signatureText}>Firma y Sello</Text>
              </View>

           </View>
        </View>

        {/* NÚMERO DE PÁGINA AUTOMÁTICO */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />

      </Page>
    </Document>
  );
}