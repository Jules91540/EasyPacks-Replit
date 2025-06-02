import { createTransport } from 'nodemailer';
import { storage } from './storage';
import { InsertEmailLog } from '@shared/schema';

// Configuration du transport email avec Mailgun
const transporter = createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: {
    user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
    pass: process.env.MAILGUN_API_KEY
  }
});

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static templates = {
    welcome: (firstName: string): EmailTemplate => ({
      subject: '🎉 Bienvenue sur la plateforme de formation française !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center;">
            <h1 style="margin: 0; font-size: 2rem; font-weight: bold;">Bienvenue ${firstName} !</h1>
            <p style="margin: 1rem 0 0 0; font-size: 1.2rem; opacity: 0.9;">Votre parcours créatif commence maintenant</p>
          </div>
          
          <div style="padding: 2rem;">
            <h2 style="color: #667eea; margin-bottom: 1rem;">Félicitations pour votre inscription !</h2>
            
            <p style="line-height: 1.6; margin-bottom: 1.5rem;">
              Vous venez de rejoindre notre communauté de créateurs de contenu français. Notre plateforme vous accompagnera dans votre apprentissage du streaming, de la création de vidéos et de la gestion des réseaux sociaux.
            </p>
            
            <div style="background: #2a2a3e; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
              <h3 style="color: #667eea; margin-bottom: 1rem;">🚀 Que pouvez-vous faire maintenant ?</h3>
              <ul style="line-height: 1.8; padding-left: 1.5rem;">
                <li>Explorez nos modules de formation interactifs</li>
                <li>Testez nos simulateurs de streaming</li>
                <li>Participez aux discussions du forum</li>
                <li>Gagnez des badges et montez de niveau</li>
                <li>Chattez avec notre IA pour des conseils personnalisés</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 1rem 2rem; border-radius: 25px; font-weight: bold; display: inline-block;">
                Commencer mon parcours
              </a>
            </div>
            
            <p style="line-height: 1.6; color: #cccccc; font-size: 0.9rem;">
              Si vous avez des questions, n'hésitez pas à nous contacter ou à utiliser notre chatbot IA intégré.
            </p>
          </div>
          
          <div style="background: #16213e; padding: 1rem; text-align: center; font-size: 0.8rem; color: #888;">
            <p>Plateforme de Formation Française pour Créateurs de Contenu</p>
            <p>Vous recevez cet email car vous vous êtes inscrit sur notre plateforme.</p>
          </div>
        </div>
      `,
      text: `
        Bienvenue ${firstName} !
        
        Félicitations pour votre inscription sur notre plateforme de formation française !
        
        Vous pouvez maintenant :
        - Explorer nos modules de formation
        - Tester nos simulateurs
        - Participer au forum
        - Gagner des badges
        - Utiliser notre chatbot IA
        
        Connectez-vous pour commencer : ${process.env.FRONTEND_URL || 'http://localhost:5000'}
        
        Merci de nous avoir rejoint !
      `
    }),

    passwordChange: (firstName: string): EmailTemplate => ({
      subject: '🔒 Votre mot de passe a été modifié',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 2rem; text-align: center;">
            <h1 style="margin: 0; font-size: 1.8rem; font-weight: bold;">Mot de passe modifié</h1>
          </div>
          
          <div style="padding: 2rem;">
            <h2 style="color: #f093fb;">Bonjour ${firstName},</h2>
            
            <p style="line-height: 1.6; margin-bottom: 1.5rem;">
              Votre mot de passe a été modifié avec succès le ${new Date().toLocaleString('fr-FR')}.
            </p>
            
            <div style="background: #2a2a3e; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #f093fb;">
              <p style="margin: 0; font-weight: bold;">Si vous n'êtes pas à l'origine de cette modification :</p>
              <p style="margin: 0.5rem 0 0 0;">Contactez immédiatement notre support technique.</p>
            </div>
            
            <p style="line-height: 1.6; color: #cccccc; font-size: 0.9rem;">
              Pour votre sécurité, nous vous recommandons d'utiliser un mot de passe unique et complexe.
            </p>
          </div>
        </div>
      `,
      text: `
        Bonjour ${firstName},
        
        Votre mot de passe a été modifié avec succès le ${new Date().toLocaleString('fr-FR')}.
        
        Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.
        
        Merci.
      `
    }),

    notification: (firstName: string, title: string, message: string): EmailTemplate => ({
      subject: `📢 ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center;">
            <h1 style="margin: 0; font-size: 1.8rem; font-weight: bold;">${title}</h1>
          </div>
          
          <div style="padding: 2rem;">
            <h2 style="color: #667eea;">Bonjour ${firstName},</h2>
            <p style="line-height: 1.6;">${message}</p>
          </div>
        </div>
      `,
      text: `${title}\n\nBonjour ${firstName},\n\n${message}`
    })
  };

  static async sendEmail(
    type: 'welcome' | 'password_change' | 'notification',
    recipient: string,
    data: any,
    userId?: string
  ): Promise<boolean> {
    try {
      let template: EmailTemplate;
      
      switch (type) {
        case 'welcome':
          template = this.templates.welcome(data.firstName);
          break;
        case 'password_change':
          template = this.templates.passwordChange(data.firstName);
          break;
        case 'notification':
          template = this.templates.notification(data.firstName, data.title, data.message);
          break;
        default:
          throw new Error(`Type d'email non supporté: ${type}`);
      }

      // Envoi réel de l'email via Gmail
      console.log(`📧 Tentative d'envoi d'email à ${recipient}`);
      console.log(`Sujet: ${template.subject}`);
      
      const result = await transporter.sendMail({
        from: `"EasyPacks Formation" <postmaster@${process.env.MAILGUN_DOMAIN}>`,
        to: recipient,
        subject: template.subject,
        text: template.text,
        html: template.html
      });
      
      console.log(`✅ Email envoyé avec succès à ${recipient}`);
      console.log(`Message ID: ${result.messageId}`);

      // Enregistrer dans les logs
      if (userId) {
        await storage.logEmail({
          id: Date.now().toString(),
          userId,
          type,
          recipient,
          subject: template.subject,
          content: template.text,
          status: 'sent'
        });
      }

      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      
      // Enregistrer l'erreur dans les logs
      if (userId) {
        await storage.logEmail({
          id: Date.now().toString(),
          userId,
          type,
          recipient,
          subject: 'Erreur envoi',
          content: error instanceof Error ? error.message : 'Erreur inconnue',
          status: 'failed'
        });
      }
      
      return false;
    }
  }

  static async sendWelcomeEmail(user: { id: string; email: string; firstName: string }): Promise<boolean> {
    if (!user.email) return false;
    
    return await this.sendEmail('welcome', user.email, {
      firstName: user.firstName || 'Nouveau membre'
    }, user.id);
  }

  static async sendPasswordChangeEmail(user: { id: string; email: string; firstName: string }): Promise<boolean> {
    if (!user.email) return false;
    
    return await this.sendEmail('password_change', user.email, {
      firstName: user.firstName || 'Utilisateur'
    }, user.id);
  }

  static async sendNotificationEmail(
    user: { id: string; email: string; firstName: string }, 
    title: string, 
    message: string
  ): Promise<boolean> {
    if (!user.email) return false;
    
    return await this.sendEmail('notification', user.email, {
      firstName: user.firstName || 'Utilisateur',
      title,
      message
    }, user.id);
  }
}