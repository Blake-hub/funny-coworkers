package com.example.pmis.util;

import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public final class MentionExtractor {

    /**
     * Matches a Tiptap mention span where {@code data-type="mention"} appears
     * BEFORE {@code data-id="NNN"}.
     */
    private static final Pattern MENTION_ID_TYPE_FIRST = Pattern.compile(
            "<span\\b[^>]*\\bdata-type\\s*=\\s*([\"'])mention\\1"
          + "[^>]*\\bdata-id\\s*=\\s*([\"'])(\\d+)\\2",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Matches a Tiptap mention span where {@code data-id="NNN"} appears
     * BEFORE {@code data-type="mention"}.
     * <p>
     * ProseMirror / Tiptap may occasionally reorder attributes when merging
     * options, HTMLAttributes and suggestion attrs, so we must accept BOTH
     * orderings to avoid silently dropping mentions.
     */
    private static final Pattern MENTION_ID_ID_FIRST = Pattern.compile(
            "<span\\b[^>]*\\bdata-id\\s*=\\s*([\"'])(\\d+)\\1"
          + "[^>]*\\bdata-type\\s*=\\s*([\"'])mention\\3",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Fallback: look for ANY {@code data-id="NNN"} inside a mention-like span
     * (span that either has class="mention" or contains a "@" text node nearby
     * OR explicitly uses the Tiptap data-type attribute).  This is a safety
     * net in case newlines or extra whitespace cause the strict patterns above
     * to miss a mention.
     */
    private static final Pattern MENTION_ID_FALLBACK = Pattern.compile(
            "<span\\b(?=[^>]*class\\s*=\\s*([\"'])[^\"']*\\bmention\\b[^\"']*\\1)"
          + "[^>]*\\bdata-id\\s*=\\s*([\"'])(\\d+)\\2",
            Pattern.CASE_INSENSITIVE
    );

    private MentionExtractor() {
    }

    /**
     * Extracts every unique user ID referenced by Tiptap mention spans in the
     * provided wiki page HTML.
     *
     * @param html raw HTML as persisted for a wiki page
     * @return unique numeric user IDs referenced by mentions; never null
     */
    public static Set<Long> extractUserIds(String html) {
        if (html == null || html.isBlank()) {
            log.debug("extractUserIds: input null/empty -> empty");
            return Collections.emptySet();
        }
        final Set<Long> out = new LinkedHashSet<>();

        // 1) data-type="mention" first, then data-id
        collectLongs(out, MENTION_ID_TYPE_FIRST.matcher(html), 3,
                "TYPE_FIRST");
        // 2) data-id first, then data-type="mention"
        collectLongs(out, MENTION_ID_ID_FIRST.matcher(html), 2,
                "ID_FIRST");

        // 3) If the two strict patterns produced nothing, try the looser
        // fallback pattern based on class="mention" to catch any renderer
        // variants (e.g. custom renderHTML reordering / extra attributes).
        if (out.isEmpty()) {
            collectLongs(out, MENTION_ID_FALLBACK.matcher(html), 3,
                    "FALLBACK(class=mention)");
        }

        if (log.isDebugEnabled()) {
            log.debug("extractUserIds: html.len={}, extracted user IDs={}",
                    html.length(), out);
        }
        return out;
    }

    private static void collectLongs(Set<Long> out, Matcher m,
                                     int idGroup, String patternName) {
        while (m.find()) {
            final String raw = m.group(idGroup);
            if (raw == null || raw.isEmpty()) continue;
            try {
                final Long id = Long.parseLong(raw);
                final boolean added = out.add(id);
                if (added) {
                    log.trace("extractUserIds: pattern={} captured id={}",
                            patternName, id);
                }
            } catch (NumberFormatException ex) {
                log.warn("extractUserIds: pattern={} found non-numeric id='{}' in span, skipping",
                        patternName, raw);
            }
        }
    }
}

