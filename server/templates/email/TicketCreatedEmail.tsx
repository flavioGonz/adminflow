import { Html, Head, Preview, Body, Container, Section, Img, Text, Button } from 'react-email';

export const TicketCreatedEmail = ({ clientName = 'Cliente', ticketId = '1234', bannerUrl = 'https://via.placeholder.com/600x200', actionUrl = '#' }) => (
    <Html>
        <Head />
        <Preview>Nuevo ticket #{{ ticketId }} creado</Preview>
        <Body style={mainStyle}>
            <Container style={containerStyle}>
                <Img src={bannerUrl} alt="Banner" width="600" style={{ width: '100%', maxWidth: '600px', borderRadius: '8px' }} />
                <Section style={sectionStyle}>
                    <Text style={h1Style}>¡Hola {clientName}!</Text>
                    <Text style={paragraphStyle}>
                        Se ha creado un nuevo ticket con el número <strong>#{ticketId}</strong>. Por favor revisa los detalles y asigna el responsable.
                    </Text>
                    <Button href={actionUrl} style={buttonStyle}>Ver ticket</Button>
                    <Text style={footerStyle}>Este es un mensaje automático de AdminFlow.</Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

const mainStyle = {
    backgroundColor: '#f3f4f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '20px',
};

const containerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
};

const sectionStyle = { marginTop: '20px' };
const h1Style = { fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '12px' };
const paragraphStyle = { fontSize: '16px', lineHeight: '24px', color: '#4b5563', marginBottom: '20px' };
const buttonStyle = { backgroundColor: '#10b981', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', display: 'inline-block' };
const footerStyle = { fontSize: '12px', color: '#6b7280', marginTop: '30px' };

export default TicketCreatedEmail;
