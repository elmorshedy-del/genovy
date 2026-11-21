/*
 * itch_filter.c -- stream a Nasdaq TotalView-ITCH 5.0 file from stdin and write
 * fixed-width order-level event records for a chosen set of symbols.
 *
 * Usage:  gzip -dc FILE.gz | ./itch_filter OUTPREFIX SPY QQQ ...
 * Output: OUTPREFIX.events.bin  (struct Rec, little-endian, 40 bytes)
 *         OUTPREFIX.symbols.txt (locate code -> symbol)
 *
 * Record types written (field 'type'):
 *   'A' add order        ref, side, shares, price
 *   'F' add order (MPID) ref, side, shares, price
 *   'E' executed         ref, shares (executed), ref2 = match number
 *   'C' executed w/price ref, shares, price (exec price), extra = printable flag
 *   'X' cancel (partial) ref, shares (cancelled)
 *   'D' delete           ref
 *   'U' replace          ref (original), ref2 (new), shares, price
 *   'P' hidden trade     side (of resting non-displayed order), shares, price
 *   'Q' cross trade      shares, price, side = cross type
 *   'S' system event     side = event code
 *   'H' trading action   side = trading state
 * Prices are ITCH Price(4): integer, 4 implied decimals.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#pragma pack(push, 1)
typedef struct {
    uint64_t ts;      /* ns since midnight */
    uint64_t ref;     /* order reference number */
    uint64_t ref2;    /* new ref (U) or match number (E/C/P/Q) */
    uint32_t shares;
    uint32_t price;   /* 1e-4 dollars */
    uint16_t locate;
    char     type;
    char     side;
    uint32_t extra;
} Rec;
#pragma pack(pop)

static inline uint16_t be16(const unsigned char *p) { return (uint16_t)((p[0] << 8) | p[1]); }
static inline uint32_t be32(const unsigned char *p) { return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | p[3]; }
static inline uint64_t be48(const unsigned char *p) {
    uint64_t v = 0; for (int i = 0; i < 6; i++) v = (v << 8) | p[i]; return v; }
static inline uint64_t be64(const unsigned char *p) {
    uint64_t v = 0; for (int i = 0; i < 8; i++) v = (v << 8) | p[i]; return v; }

int main(int argc, char **argv) {
    if (argc < 3) { fprintf(stderr, "usage: %s OUTPREFIX SYM...\n", argv[0]); return 1; }
    char path[4096];
    snprintf(path, sizeof path, "%s.events.bin", argv[1]);
    FILE *out = fopen(path, "wb");
    snprintf(path, sizeof path, "%s.symbols.txt", argv[1]);
    FILE *symf = fopen(path, "w");
    if (!out || !symf) { perror("fopen"); return 1; }

    int nsym = argc - 2;
    char want[64][9];
    for (int i = 0; i < nsym && i < 64; i++) {
        memset(want[i], ' ', 8); want[i][8] = 0;
        size_t L = strlen(argv[i + 2]); if (L > 8) L = 8;
        memcpy(want[i], argv[i + 2], L);
    }
    static unsigned char keep[65536];
    memset(keep, 0, sizeof keep);

    static unsigned char inbuf[1 << 22];
    setvbuf(stdin, NULL, _IOFBF, 1 << 24);
    setvbuf(out, NULL, _IOFBF, 1 << 24);
    unsigned char hdr[2], msg[65536];
    uint64_t nmsg = 0, nout = 0;
    (void)inbuf;
    while (fread(hdr, 1, 2, stdin) == 2) {
        uint16_t len = be16(hdr);
        if (len == 0) continue;
        if (fread(msg, 1, len, stdin) != len) break;
        nmsg++;
        char t = (char)msg[0];
        uint16_t loc = be16(msg + 1);
        Rec r; memset(&r, 0, sizeof r);
        r.type = t; r.locate = loc; r.ts = be48(msg + 5);
        switch (t) {
        case 'S':
            r.side = (char)msg[11]; fwrite(&r, sizeof r, 1, out); nout++; break;
        case 'R': {
            char sym[9]; memcpy(sym, msg + 11, 8); sym[8] = 0;
            for (int i = 0; i < nsym; i++) if (memcmp(sym, want[i], 8) == 0) {
                keep[loc] = 1; fprintf(symf, "%u %s\n", loc, sym); fflush(symf); }
            break; }
        case 'H':
            if (keep[loc]) { r.side = (char)msg[19]; fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'A': case 'F':
            if (keep[loc]) { r.ref = be64(msg + 11); r.side = (char)msg[19]; r.shares = be32(msg + 20);
                r.price = be32(msg + 32); fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'E':
            if (keep[loc]) { r.ref = be64(msg + 11); r.shares = be32(msg + 19); r.ref2 = be64(msg + 23);
                fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'C':
            if (keep[loc]) { r.ref = be64(msg + 11); r.shares = be32(msg + 19); r.ref2 = be64(msg + 23);
                r.extra = msg[31]; r.price = be32(msg + 32); fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'X':
            if (keep[loc]) { r.ref = be64(msg + 11); r.shares = be32(msg + 19); fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'D':
            if (keep[loc]) { r.ref = be64(msg + 11); fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'U':
            if (keep[loc]) { r.ref = be64(msg + 11); r.ref2 = be64(msg + 19); r.shares = be32(msg + 27);
                r.price = be32(msg + 31); fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'P':
            if (keep[loc]) { r.ref = be64(msg + 11); r.side = (char)msg[19]; r.shares = be32(msg + 20);
                r.price = be32(msg + 32); r.ref2 = be64(msg + 36); fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        case 'Q':
            if (keep[loc]) { r.shares = (uint32_t)be64(msg + 11); r.price = be32(msg + 27);
                r.ref2 = be64(msg + 31); r.side = (char)msg[39]; fwrite(&r, sizeof r, 1, out); nout++; }
            break;
        default: break;
        }
    }
    fprintf(stderr, "messages=%llu written=%llu\n", (unsigned long long)nmsg, (unsigned long long)nout);
    fclose(out); fclose(symf);
    return 0;
}
