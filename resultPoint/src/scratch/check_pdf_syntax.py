import pypdf
import pymupdf
import re

def check_pdf(filename):
    print(f"\n==================================================")
    print(f"Inspecting: {filename}")
    print(f"==================================================")

    # 1. pypdf strict reading
    try:
        reader = pypdf.PdfReader(filename, strict=True)
        print(f"[pypdf] Successfully read {len(reader.pages)} page(s)")
    except Exception as e:
        print(f"[pypdf ERROR] Failed strict parsing: {e}")
        return

    # 2. PyMuPDF strict reading & text extraction
    try:
        doc = pymupdf.open(filename)
        print(f"[PyMuPDF] Successfully opened with {len(doc)} page(s)")
        for idx, page in enumerate(doc):
            text = page.get_text()
            print(f"  Page {idx + 1}: {len(text)} characters extracted")
    except Exception as e:
        print(f"[PyMuPDF ERROR] {e}")

    # 3. Content stream operator analysis
    for idx, page in enumerate(reader.pages):
        contents = page.get_contents()
        raw_stream = contents.get_data().decode('latin1', errors='replace')
        lines = raw_stream.split('\n')
        print(f"  Page {idx + 1} stream: {len(lines)} lines, {len(raw_stream)} bytes")
        
        for line_no, line in enumerate(lines, 1):
            trimmed = line.strip()
            if not trimmed:
                continue
            
            # Check for unexpanded JS template literals
            if "${" in trimmed:
                print(f"  [SYNTAX ERROR] Line {line_no}: Unexpanded template literal -> '{trimmed}'")
            
            # Check for PostScript-only operators
            tokens = trimmed.split()
            last_token = tokens[-1]
            if last_token in ['arc', 'arcn', 'stroke', 'show', 'moveto', 'lineto', 'curveto', 'closepath', 'fill']:
                print(f"  [SYNTAX ERROR] Line {line_no}: Invalid PostScript operator '{last_token}' -> '{trimmed}'")

            # Check for missing Tj before ET
            if trimmed.endswith(") ET"):
                print(f"  [SYNTAX ERROR] Line {line_no}: Missing 'Tj' operator before 'ET' -> '{trimmed}'")

if __name__ == "__main__":
    check_pdf("test_sgpa_raw.pdf")
    check_pdf("test_percentage_raw.pdf")
