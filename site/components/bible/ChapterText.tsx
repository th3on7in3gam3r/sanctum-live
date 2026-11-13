import { Fragment, type ReactNode } from 'react';
import type { ChapterItem } from '@/lib/bible';

/** Turns the API's verse/line-break stream into readable paragraphs. */
export function ChapterText({ content, footnoteCallers }: { content: ChapterItem[]; footnoteCallers: Map<number, string> }) {
  const blocks: ReactNode[] = [];
  let paragraph: ReactNode[] = [];
  let key = 0;
  const flush = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={`p${key++}`} className="mb-5 text-[19px] leading-[1.85] text-ink">
          {paragraph}
        </p>
      );
      paragraph = [];
    }
  };

  for (const item of content) {
    if (item.type === 'heading') {
      flush();
      blocks.push(
        <h3 key={`h${key++}`} className="font-display mb-3 mt-8 text-2xl text-forest-800">
          {item.content.join(' ')}
        </h3>
      );
      continue;
    }
    if (item.type === 'line_break') {
      flush();
      continue;
    }
    const parts: ReactNode[] = [];
    item.content.forEach((part, i) => {
      if (typeof part === 'string') parts.push(<Fragment key={i}>{part} </Fragment>);
      else if ('text' in part)
        parts.push(
          <span key={i} className={part.wordsOfJesus ? 'text-[#8b2e2e]' : undefined}>
            {part.text}{' '}
          </span>
        );
      else if ('heading' in part) {
        parts.push(
          <span key={i} className="font-display block pt-3 text-xl text-forest-800">
            {part.heading}
          </span>
        );
      } else if ('lineBreak' in part) parts.push(<br key={i} />);
      else if ('noteId' in part) {
        const caller = footnoteCallers.get(part.noteId);
        parts.push(
          <sup key={i}>
            <a href={`#note-${part.noteId}`} className="px-0.5 text-[11px] font-bold text-gold-text no-underline">
              {caller}
            </a>
          </sup>
        );
      }
    });
    if (item.type === 'hebrew_subtitle') {
      flush();
      blocks.push(
        <p key={`s${key++}`} className="mb-4 text-[17px] italic text-ink/70">
          {parts}
        </p>
      );
      continue;
    }
    paragraph.push(
      <Fragment key={`v${item.number}`}>
        <sup id={`v${item.number}`} className="mr-1 scroll-mt-28 text-[12px] font-bold text-gold-text">
          {item.number}
        </sup>
        {parts}
      </Fragment>
    );
  }
  flush();
  return <>{blocks}</>;
}

