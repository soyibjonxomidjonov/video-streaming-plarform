import re

files = [
    r"d:\D_Desktop\video-streaming-platform\frontend_v1\frontendv2\app\(admin)\admin\movies\page.tsx",
    r"d:\D_Desktop\video-streaming-platform\frontend_v1\frontendv2\app\(admin)\admin\episodes\page.tsx"
]

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace the inline style + className with the clean, elegant Tailwind styles
    content = re.sub(
        r'style=\{\{\s*backgroundColor:\s*\'#0B1215\',\s*border:\s*\'2px solid rgba\(0,255,163,0\.4\)\'\s*\}\}\s*className="w-full rounded-xl',
        r'className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A]',
        content
    )
    
    # Also adjust the focus border to be consistent with the subtle elegant look
    content = content.replace(
        "focus:border-[#00FFA3]",
        "focus:border-[rgba(0,255,163,0.5)]"
    )

    with open(file, "w", encoding="utf-8") as f:
        f.write(content)

print("Done replacing.")
