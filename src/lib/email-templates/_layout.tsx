import * as React from 'react'
import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components'

interface LayoutProps {
  preview: string
  title: string
  children: React.ReactNode
}

export function EmailLayout({ preview, title, children }: LayoutProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>SAINT-JACQUES · DAX</Text>
            <Text style={titleStyle}>{title}</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Section style={footer}>
            <Text style={footerText}>
              Boutique des uniformes Saint-Jacques-de-Compostelle · France Uniformes
            </Text>
            <Text style={footerSmall}>
              Pour toute question, répondez simplement à cet email — il sera reçu par notre équipe.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const text = { fontSize: '15px', lineHeight: '1.6', color: '#1a1a1a', margin: '0 0 14px' }
export const muted = { fontSize: '13px', lineHeight: '1.5', color: '#666666', margin: '14px 0 0' }
export const button = {
  display: 'inline-block',
  background: '#0f3a5f',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '14px',
  marginTop: '8px',
}
export const list = { fontSize: '14px', lineHeight: '1.7', color: '#1a1a1a', paddingLeft: '20px', margin: '0 0 14px' }

const body = { backgroundColor: '#ffffff', margin: 0, padding: '32px 16px', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eeeae0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }
const header = { backgroundColor: '#0f3a5f', padding: '24px 32px' }
const brand = { fontSize: '12px', letterSpacing: '2px', color: '#ffffff', opacity: 0.85, margin: 0, fontWeight: 600 }
const titleStyle = { fontSize: '22px', fontWeight: 600, color: '#ffffff', margin: '6px 0 0' }
const content = { padding: '32px', backgroundColor: '#ffffff' }
const footer = { backgroundColor: '#fafaf7', padding: '20px 32px', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#777777', margin: 0 }
const footerSmall = { fontSize: '11px', color: '#999999', margin: '6px 0 0' }