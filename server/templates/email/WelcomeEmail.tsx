import { Html, Head, Preview, Body, Container, Section, Img, Text, Button } from 'react-email';

export const WelcomeEmail = ({ clientName = 'Cliente', bannerUrl = 'https://via.placeholder.com/600x200', actionUrl = '#' }) => (
    <Html>
        <Head />
        <Preview>¡Bienvenido a AdminFlow, {clientName}!</Preview>
        <Body style={mainStyle}>
            <Container style={containerStyle}>
                <Img src={bannerUrl} alt="Banner" width="600" style={{ width: '100%', maxWidth: '600px', borderRadius: '8px' }} />
                <Section style={sectionStyle}>
                    <Text style={h1Style}>¡Hola {clientName}!</Text>
                    <Text style={paragraphStyle}>
                        Nos complace darte la bienvenida a <strong>AdminFlow</strong>. Tu cuenta está lista para que empieces a gestionar tus procesos.
                    </Text>
                    <Button href={actionUrl} style={buttonStyle}>Empezar ahora</Button>
                    <Text style={footerStyle}>Si tienes alguna duda, contáctanos en support@adminflow.com.</Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

const mainStyle = {
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '20px',
};

const containerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const sectionStyle = { marginTop: '20px' };
const h1Style = { fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '12px' };
const paragraphStyle = { fontSize: '16px', lineHeight: '24px', color: '#4b5563', marginBottom: '20px' };
const buttonStyle = { backgroundColor: '#6366f1', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', display: 'inline-block' };
const footerStyle = { fontSize: '12px', color: '#6b7280', marginTop: '30px' };

export default WelcomeEmail;
