import { Link } from "wouter";

interface MentionTextProps {
  content: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

// Simuler une base d'utilisateurs (en production, cela viendrait d'une API)
const knownUsers: User[] = [
  { id: "43311594", firstName: "Easy", lastName: "Packs" },
  { id: "109791419912459995702", firstName: "Gameli", lastName: "SENYO" },
  { id: "105806234081112158042", firstName: "Julien", lastName: "Pariès" }
];

export default function MentionText({ content }: MentionTextProps) {
  // Fonction pour parser le contenu et identifier les mentions
  const parseContent = (text: string) => {
    const mentionRegex = /@(\w+\s?\w*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Ajouter le texte avant la mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      // Trouver l'utilisateur correspondant à la mention
      const mentionText = match[1];
      const user = knownUsers.find(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase() === mentionText.toLowerCase() ||
        `${u.firstName}${u.lastName}`.toLowerCase() === mentionText.toLowerCase() ||
        u.firstName.toLowerCase() === mentionText.toLowerCase()
      );

      if (user) {
        parts.push({
          type: 'mention',
          content: `@${mentionText}`,
          userId: user.id,
          key: `mention-${match.index}`
        });
      } else {
        parts.push({
          type: 'text',
          content: match[0],
          key: `text-${match.index}`
        });
      }

      lastIndex = mentionRegex.lastIndex;
    }

    // Ajouter le texte restant
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return parts;
  };

  const parts = parseContent(content);

  return (
    <span>
      {parts.map((part) => {
        if (part.type === 'mention') {
          return (
            <Link
              key={part.key}
              href={`/profile/${part.userId}`}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer hover:underline"
            >
              {part.content}
            </Link>
          );
        }
        return <span key={part.key}>{part.content}</span>;
      })}
    </span>
  );
}