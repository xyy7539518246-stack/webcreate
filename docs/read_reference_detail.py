# -*- coding: utf-8 -*-
"""详细读取参考样例中课程实践报告部分的格式"""
import docx
from docx.shared import Pt

doc = docx.Document(r'C:\Users\mechrevo\Desktop\web开发\学生提交材料样例参考.docx')

# 找到"十一、课程实践报告"的位置
start = None
for i, p in enumerate(doc.paragraphs):
    if '课程实践报告' in p.text and p.style.name.startswith('Heading'):
        start = i
        break

print(f'课程实践报告起始段落: {start}')
print(f'总段落数: {len(doc.paragraphs)}')
print()

# 读取从 start 到结束的所有段落，详细格式
for i in range(start, min(start + 80, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    text = p.text
    if not text.strip() and i > start + 5:
        continue
    style = p.style.name
    align = p.alignment
    pf = p.paragraph_format
    
    # 获取第一个 run 的格式
    run_info = ''
    if p.runs:
        r = p.runs[0]
        sz = r.font.size.pt if r.font.size else 'inherit'
        bold = r.font.bold
        name = r.font.name
        run_info = f'[font={name}, size={sz}, bold={bold}]'
    
    indent = pf.first_line_indent
    indent_str = f'indent={indent.pt if indent else 0}pt'
    space_b = pf.space_before.pt if pf.space_before else 0
    space_a = pf.space_after.pt if pf.space_after else 0
    
    print(f'[{i}][{style}] align={align} {indent_str} before={space_b} after={space_a} {run_info}')
    print(f'     文本: {text[:100]}')
    print()
