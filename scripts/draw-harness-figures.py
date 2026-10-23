"""Rebuild the 20 learning-note figures as self-contained, editable SVGs.
Run with Python 3; no external libraries or source screenshots are needed.
"""
from pathlib import Path
from html import escape
import json
import unicodedata

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist/assets/articles/harness'
OUT.mkdir(parents=True, exist_ok=True)
W = 1120
BG, INK, GREEN, MUTED = '#fafaf6', '#253b31', '#37694f', '#6d776e'
RULE, PALE, BLUE, RUST, GOLD = '#d4dbd0', '#edf2e9', '#426584', '#a75c46', '#977735'
SERIF = "'Songti SC','Noto Serif CJK SC',serif"
SANS = "'Hiragino Sans GB','PingFang SC','Noto Sans CJK SC',sans-serif"
MONO = "'SFMono-Regular','Menlo',monospace"
manifest = []

def wrap(value, width, size):
    result = []
    for paragraph in str(value).split('\n'):
        line, used = '', 0
        for ch in paragraph:
            unit = size * (1 if unicodedata.east_asian_width(ch) in 'WF' else .58)
            if line and used + unit > width:
                result.append(line.rstrip()); line, used = '', 0
            line += ch; used += unit
        result.append(line.rstrip())
    return result

class Figure:
    def __init__(self, n, title, subtitle, h=640):
        self.n, self.title, self.subtitle, self.h = n, title, subtitle, h
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{h}" viewBox="0 0 {W} {h}" role="img" aria-labelledby="title desc">',
                      f'<title id="title">{escape(title)}</title><desc id="desc">{escape(subtitle)}</desc>',
                      '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="none" stroke="context-stroke" stroke-width="1.6"/></marker></defs>']
        self.rect(0,0,W,h,BG)
        self.text(48,45,f'FIG. {n:02}',18,GREEN,font=MONO)
        self.text(48,98,title,36,INK,600,font=SERIF)
        self.text(48,139,subtitle,21,MUTED)
        self.line(48,163,1072,163,RULE)
        self.line(48,h-42,1072,h-42,RULE)
        self.text(48,h-17,'HARNESS / LOOP',15,MUTED,font=MONO)
        self.text(1072,h-17,f'{n:02} / 20',15,MUTED,anchor='end',font=MONO)
    def raw(self,s): self.parts.append(s)
    def rect(self,x,y,w,h,fill='none',stroke=None,sw=1.5,rx=0):
        self.raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="{sw}" rx="{rx}"/>')
    def line(self,x1,y1,x2,y2,color=RULE,sw=1.5,dash=None,arrow=False):
        self.raw(f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="{color}" stroke-width="{sw}"'+(f' stroke-dasharray="{dash}"' if dash else '')+(' marker-end="url(#arrow)"' if arrow else '')+'/>')
    def path(self,d,color=GREEN,sw=2,dash=None,arrow=False):
        self.raw(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}"'+(f' stroke-dasharray="{dash}"' if dash else '')+(' marker-end="url(#arrow)"' if arrow else '')+'/>')
    def circle(self,x,y,r,fill='none',stroke=RULE,sw=2):
        self.raw(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
    def text(self,x,y,value,size=26,color=INK,weight=400,anchor='start',font=SANS):
        self.raw(f'<text x="{x}" y="{y}" font-family="{escape(font,quote=True)}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{escape(str(value))}</text>')
    def para(self,x,y,value,width,size=25,color=INK,leading=None,weight=400):
        lines = wrap(value,width,size)
        for i,line in enumerate(lines): self.text(x,y+i*(leading or size*1.55),line,size,color,weight)
        return y + len(lines)*(leading or size*1.55)
    def node(self,x,y,w,h,title,detail='',color=GREEN,fill=PALE,size=26):
        self.rect(x,y,w,h,fill,color)
        self.text(x+w/2,y+(h*.48 if detail else h*.5+size*.35),title,size,color,600,'middle')
        if detail: self.text(x+w/2,y+h*.77,detail,20,MUTED,anchor='middle')
    def band(self,y,text,color=GREEN):
        self.rect(48,y,1024,64,PALE)
        self.rect(48,y,4,64,color)
        self.text(70,y+41,text,26,color,500)
    def save(self):
        name=f'redraw-{self.n:02}.svg'
        (OUT/name).write_text('\n'.join(self.parts+['</svg>'])+'\n')
        manifest.append(dict(sourceFigure=self.n,file=name,title=self.title,description=self.subtitle,width=W,height=self.h))

# 01 — a bounded iteration, with the person at both ends.
f=Figure(1,'让一轮修复自己跑完','人定义问题，Agent 迭代，最后由人复核上线。',610)
f.text(48,211,'人',20,MUTED); f.text(270,211,'Agent 执行',20,GREEN)
nodes=[(48,242,170,'定义问题','范围与验收'),(264,242,158,'分析','定位 bad case'),(458,242,158,'修改','代码 / Prompt'),(652,242,158,'部署','固定版本'),(846,242,226,'评测','输出结果与分数')]
for x,y,w,t,d in nodes: f.node(x,y,w,96,t,d, GREEN if x>48 else MUTED,PALE if x>48 else BG)
for a,b in zip(nodes,nodes[1:]): f.line(a[0]+a[2]+5,290,b[0]-9,290,GREEN,2,arrow=True)
f.path('M958 338 V396 H344 V347',RUST,2,arrow=True); f.text(576,384,'未达标：带着结果继续下一轮',23,RUST,anchor='middle')
f.line(958,398,958,439,GREEN,2,arrow=True); f.text(981,430,'达标',20,GREEN); f.node(806,451,266,67,'人工复核 · 上线',color=GREEN,fill=BG)
f.text(48,504,'完成 / 预算 / 权限 / 人工判断：预先写清退出条件',23,MUTED)
f.save()

# 02 — tool surfaces, then the shared environment.
f=Figure(2,'先把四个动作接通','操作入口要能调用，结果要能取回。',630)
labels=[('01','修改','代码库 + 命令行','开发技能'),('02','部署','构建 + 发布','部署技能'),('03','评测','发起 + 跟踪','评测技能'),('04','取结果','下载 + 解析','结果技能')]
for i,(num,title,a,b) in enumerate(labels):
    x=48+i*264
    f.text(x,218,num,24,GREEN,font=MONO); f.text(x,265,title,32,INK,600)
    f.para(x,314,a,235,24); f.text(x,352,b,23,MUTED)
    if i<3: f.line(x+219,263,x+249,263,GREEN,2,arrow=True)
f.rect(48,397,1024,138,PALE)
f.text(72,436,'共同的运行条件',24,GREEN,600)
f.text(72,478,'代码库 / 分支 / 固定环境 / 权限范围',25)
f.text(72,517,'评测任务 / 评测范围 / 结果位置 / 分析技能',25)
f.save()

# 03 — execution discipline paired with context handoff.
f=Figure(3,'长任务里，先管住执行和上下文','早停、机械重试、上下文堆积，都需要具体的处理办法。',710)
items=[('持续推进','按约定推进当前任务。\n遇到边界，按约定退出。'),('异常先查','相同错误再次出现，先分析原因，\n再决定下一步。'),('一次一件','保留当前目标，避免任务越做越散。')]
for i,(t,d) in enumerate(items):
    y=220+i*123; f.text(48,y,t,27,GREEN,600); f.para(48,y+39,d,449,23)
f.line(538,202,538,596,RULE)
f.node(585,205,487,87,'主 Agent','保留任务、轮次与当前擂主')
f.line(828,296,828,343,GREEN,2,arrow=True)
f.text(854,330,'只交接必要说明',21,MUTED)
f.node(585,352,487,101,'子 Agent','承接复杂分析，隔离上下文消耗')
f.path('M1072 403 H1091 V249 H1080',BLUE,2,arrow=True)
f.text(600,514,'交回结论、证据、产物位置',24,BLUE)
f.text(600,559,'不复制整段历史',23,MUTED)
f.text(48,632,'退出条件：完成、预算用尽、缺少权限，或等待人工决策。',23,MUTED)
f.save()

# 04 — information separation and champion selection.
f=Figure(4,'让改动过验证，再换掉擂主','避免把评分理由里的某个数字，直接抄成一条专用规则。',690)
f.rect(48,203,483,170,PALE); f.rect(559,203,513,170,'#eef1f4')
f.text(72,246,'优化样本',30,GREEN,600); f.para(72,291,'问题 + 回答 + 分数 + 理由\n用来分析原因、修改 Prompt',432,25)
f.text(583,246,'验证集',30,BLUE,600); f.para(583,291,'只返回汇总分数\n隐藏题目、回答与评分细节',463,25)
f.node(48,432,255,85,'当前擂主','历史已验证版本')
f.node(415,432,262,85,'挑战者','从擂主出发修改')
f.node(789,432,283,85,'验证比较','达标才晋升')
f.line(311,474,403,474,GREEN,2,arrow=True); f.line(685,474,777,474,GREEN,2,arrow=True)
f.path('M930 518 V572 H175 V528',GREEN,2,arrow=True); f.text(555,558,'通过：新擂主；未通过：保留原版本',23,GREEN,anchor='middle')
f.text(48,615,'另留最终测试：反复用验证分数选优，仍可能过拟合。',23,MUTED)
f.save()

# 05 — a literal table, preserving all recorded values.
f=Figure(5,'规则可以加，也可以删','角色约束过强时，安全的普通任务也可能被拒答。',710)
cols=[48,160,373,586,800]
for x,t in zip(cols,['轮次','优化样本','验证集','较擂主变化','处理']): f.text(x,220,t,23,MUTED)
f.line(48,239,1072,239,INK)
rows=[['01','0.7477','0.7619','—','初始擂主'],['02','0.7594','0.7591','−0.0028','不晋升'],['03','0.7590','0.7464','−0.0155','不晋升'],['04','0.7492','0.7811','+0.0192','新擂主']]
for i,row in enumerate(rows):
    y=282+i*65
    if i==3: f.rect(48,y-38,1024,59,PALE)
    for j,(x,t) in enumerate(zip(cols,row)): f.text(x,y,t,27,GREEN if i==3 else (RUST if j==3 and i in (1,2) else INK),600 if i==3 else 400,font=MONO if j<4 else SANS)
    f.line(48,y+22,1072,y+22,RULE)
f.text(48,566,'加路由与规则',26,INK,500); f.line(255,556,344,556,GREEN,2,arrow=True)
f.text(365,566,'删掉过强要求',26,INK,500); f.line(578,556,667,556,GREEN,2,arrow=True)
f.text(690,566,'继续减法，验证后晋升',26,GREEN,600)
f.text(48,630,'第 2、3 轮优化样本涨分，验证集掉分，继续保留第 1 轮。',23,MUTED)
f.save()

# 06 — run metrics with exact five-dimensional scores.
f=Figure(6,'一次跑了 17 小时的迭代记录','16 轮之后，1 个候选通过人工复核并上线。',800)
for x,num,label in [(48,'17','小时持续运行'),(406,'16','轮迭代'),(764,'1','个候选上线')]:
    f.text(x,262,num,72,GREEN,600,font=MONO); f.text(x,306,label,25,MUTED)
f.line(48,343,1072,343,INK)
cols=[48,250,420,590,760,930]
for x,t in zip(cols,['版本','正确性','全面性','安全性','易读性','实用性']): f.text(x,394,t,24,MUTED)
data=[('基线',['0.6942','0.6272','0.8533','0.9587','0.6761']),('候选',['0.7118','0.6466','0.8533','0.9649','0.6901']),('变化',['+.0176','+.0194','0','+.0062','+.0140'])]
for i,(label,vals) in enumerate(data):
    y=457+i*77
    if i==2:f.rect(48,y-41,1024,65,PALE)
    f.text(48,y,label,26,GREEN if i==2 else INK,600 if i else 400)
    for x,v in zip(cols[1:],vals): f.text(x,y,v,25,GREEN if i==2 else INK,600 if i else 400,font=MONO)
    f.line(48,y+26,1072,y+26,RULE)
f.text(48,710,'安全性持平，其余四项小幅上涨。数据来自一次实践记录。',24,MUTED)
f.save()

# 07 — automation boundary as a six-step chain.
f=Figure(7,'修完这一批，下一批还在等人','中间两步自动化了，发现、派工和回收仍需要人推动。',555)
labels=['发现','初步归因','分派','修复','验证','结果回流']
for i,t in enumerate(labels):
    x=48+i*174; auto=i in(3,4)
    f.node(x,255,154,106,t,'Agent' if auto else '人工',GREEN if auto else MUTED,PALE if auto else BG,25)
    if i<5: f.line(x+158,307,x+169,307,INK,2,arrow=True)
f.rect(559,228,342,159,'none',GREEN,2)
f.text(730,210,'已能自主完成',23,GREEN,anchor='middle')
f.path('M995 370 V431 H125 V371',MUTED,2,'6 6',True)
f.text(560,467,'人还在找问题、分任务、追结果',27,MUTED,anchor='middle')
f.save()

# 08 — nested loops and the shared foundation.
f=Figure(8,'任务包进去，结果包回来','外循环决定下一站；内循环把一个任务做到可判定。',865)
f.text(48,211,'外循环',24,BLUE,600)
f.node(48,237,240,94,'入池 · 初步归因','发现与整理问题',BLUE,'#eef1f4')
f.node(416,237,276,94,'调度 · 回收','关闭 / 待定 / 改派',BLUE,'#eef1f4')
f.node(823,237,249,94,'下一站','新任务或人工判断',BLUE,'#eef1f4')
f.line(297,284,405,284,BLUE,2,arrow=True); f.line(703,284,812,284,BLUE,2,arrow=True)
f.line(553,337,553,399,GREEN,2,arrow=True); f.text(578,377,'任务包：范围、样本、验收要求',22,GREEN)
f.rect(48,414,1024,187,PALE,GREEN)
f.text(72,455,'内循环',24,GREEN,600)
steps=['诊断','方案','审查','实施','验证 · 判定']
for i,t in enumerate(steps):
    x=72+i*198; f.text(x,513,t,27,GREEN,600)
    if i<4:f.line(x+139,503,x+178,503,GREEN,2,arrow=True)
f.text(72,566,'未通过方案审查，或验证需要补充证据，回到对应步骤。',24,MUTED)
f.path('M1048 414 V349 H676 V341',BLUE,2,arrow=True)
f.text(72,652,'结果包：版本 / 输出 / 判定 / 证据 / 下一步建议',26,BLUE)
f.rect(48,697,1024,83,INK)
f.text(72,748,'Harness',27,'#ffffff',600); f.text(263,748,'工具与技能 · 状态 · 执行约束 · 评测 · 留痕',26,'#ffffff')
f.save()

# 09 — roles, with unequal columns matching the 3/5 division.
f=Figure(9,'八个角色，各管一段','外面管任务流转，里面管诊断、修复和验证。',800)
f.text(48,219,'全局控制小队',31,BLUE,600); f.text(587,219,'修复小队',31,GREEN,600)
f.line(48,242,504,242,BLUE,3); f.line(587,242,1072,242,GREEN,3)
left=[('入池执行器','拉取、归一化、去重、聚类'),('全局调度器','建单、派单、回流、人工门禁'),('通知器','送达需要判断的材料，记录回复')]
right=[('队长','拆任务，推进流转'),('方案设计者','复现、归因、提出改法'),('审查者','检查边界与验证计划'),('实施者','按审查后的计划修改'),('验证者','回测，判定每条样本的去向')]
for i,(t,d) in enumerate(left):
    y=299+i*132; f.text(48,y,t,28,BLUE,600); f.para(48,y+41,d,444,24)
for i,(t,d) in enumerate(right):
    y=289+i*81; f.text(587,y,t,26,GREEN,600); f.text(587,y+34,d,23,MUTED)
f.text(48,720,'实施和判定分开；每个角色都要交回自己的证据。',25,INK,500)
f.save()

# 10 — numeric reduction, not a generic pie chart.
f=Figure(10,'先把混杂样本整理成可路由的数据','同一个问题可能反复出现，同一个标签也可能混着不同原因。',630)
for i,t in enumerate(['拉取','归一化','去重','聚类']):
    x=48+i*264; f.text(x,229,t,29,INK,600)
    if i<3:f.line(x+155,219,x+236,219,GREEN,2,arrow=True)
nums=[(48,'404','候选样本'),(439,'323','去重后纳入分发'),(850,'16','路由组')]
for x,num,label in nums:f.text(x,365,num,72,GREEN,600,font=MONO); f.text(x,413,label,25,MUTED)
f.line(246,348,389,348,RUST,2,arrow=True); f.text(315,313,'−81',29,RUST,600,'middle',MONO)
f.line(646,348,804,348,GREEN,2,arrow=True); f.text(724,313,'聚类',24,GREEN,anchor='middle')
f.band(491,'先去重，再按原因组织；把重复修复挡在派单之前。')
f.save()

# 11 — dispatcher responsibilities and notification handoff.
f=Figure(11,'调度器只负责派单与回流','把诊断留给修复小队，把判断留给有权限的人。',720)
steps=[('1','接收入池结果'),('2','按路由规则派单'),('3','处理改派与回传'),('4','必要时触发人工门禁')]
for i,(n,t) in enumerate(steps):
    x=48+i*264; f.text(x,225,n,32,BLUE,600,font=MONO); f.para(x,268,t,237,26)
f.line(48,335,1072,335,INK)
f.text(48,388,'往下传什么',28,BLUE,600)
f.para(48,431,'编号、归因标签、样本数据、期望产出。\n不替小队给出诊断结论。',453,25)
f.line(546,370,546,577,RULE)
f.text(588,388,'通知器怎样交接',28,GREEN,600)
f.para(588,431,'按模板送达，检查对象与材料。\n收到人的回复，写回原工单。\n系统记录送达和回执。',477,25)
f.band(611,'送达、回复、业务判断，各自留下记录。')
f.save()

# 12 — the original three-way diagnosis, anonymized.
f=Figure(12,'25 条“没有澄清”，要拆成三组','相同的标签，不代表相同的修复方向。',730)
items=[('A','短输入直接答','“某省档案”','检索找到一个解释，\n模型没有确认就回答。','要先定澄清边界',GREEN),('B','多义词被补全','“100 / 75”','可能有多种含义，\n模型擅自认成一种。','先确认，再回答',BLUE),('C','标签本来就错','“到某地有几公里”','距离问题本身明确，\n不属于这次澄清修复。','改派或纠正归因',GOLD)]
for i,(n,title,example,detail,action,c) in enumerate(items):
    x=48+i*348; f.line(x,208,x+328,208,c,4); f.text(x,258,n,39,c,600,font=MONO)
    f.text(x,303,title,27,c,600); f.text(x,366,example,24,INK,500)
    f.para(x,422,detail,320,24)
    f.line(x,530,x+328,530,RULE); f.para(x,578,action,320,26,c,weight=600)
f.text(48,665,'先重新检查样本，再决定改策略、改规则，还是改派。',25,MUTED)
f.save()

# 13 — evidence, policy decision, review and unlock.
f=Figure(13,'证据先缩小范围，人来定策略边界','方向确认、方案审查都通过，实施者再动手。',770)
steps=[(48,166,'诊断','排查链路',GREEN),(270,177,'人工确认','澄清策略怎么定',GOLD),(503,166,'方案','写清改动',GREEN),(725,143,'审查','检查四项门禁',BLUE),(924,148,'实施','解锁修改',GREEN)]
for x,w,t,d,c in steps:f.node(x,238,w,110,t,d,c,PALE if c==GREEN else BG,size=27)
for a,b in zip(steps,steps[1:]): f.line(a[0]+a[1]+6,293,b[0]-10,293,INK,2,arrow=True)
f.path('M356 353 V396 H128 V358',GOLD,2,arrow=True); f.text(250,427,'证据不足：返回诊断',23,GOLD,anchor='middle')
f.text(48,497,'诊断交回',26,GREEN,600); f.para(48,541,'排除了什么\n还怀疑什么\n需要人决定什么',436,26)
f.line(527,472,527,666,RULE)
f.text(576,497,'审查四项门禁',26,BLUE,600)
f.para(576,541,'改动范围 / 回滚条件\n回归样本 / 否决条件',496,26)
f.text(576,646,'本次仅改澄清规则，其他路由保持原样。',22,MUTED)
f.save()

# 14 — one prompt, two changes. Not a screenshot of a PR.
f=Figure(14,'一份 Prompt，两处规则','把“需要澄清”写成具体可执行的动作。',755)
f.text(48,222,'01  给原规则补例外',30,GREEN,600)
f.para(48,273,'原规则：能获得必要信息时，直接回答。\n补充：极短、语音碎片、错字等输入，\n如果意图仍不明确，先确认或反问。',1000,27)
f.line(48,402,1072,402,RULE)
f.text(48,454,'02  把例外写成判断',30,BLUE,600)
f.para(48,505,'多义或不明确 → 先确认“最影响结果的含义”。\n碎片 / 歧义输入 → 先问最关键的一个问题。\n不要拼接缺失历史，不把猜测当成事实。',1000,27)
f.text(48,689,'实施动作：新建分支 → 修改文件 → 提交可审查的变更。',24,MUTED)
f.save()

# 15 — denominator-aware request/sample outcome accounting.
f=Figure(15,'66 次请求，回收成四种去向','25 条样本：先改派 3 条，22 条各回测 3 次。',770)
for i,t in enumerate(['确认版本','目标回测','基准回归','质量门槛']):
    x=48+i*264; f.text(x,226,t,27,INK,600)
    if i<3:f.line(x+151,216,x+238,216,GREEN,2,arrow=True)
f.text(48,340,'25',67,INK,600,font=MONO); f.text(164,335,'条样本',25,MUTED)
f.line(259,320,375,320,GREEN,2,arrow=True); f.text(409,340,'22 × 3 = 66',48,GREEN,600,font=MONO); f.text(819,335,'次请求',25,MUTED)
f.text(48,401,'其中 3 条先改派',25,GOLD); f.text(410,401,'下面按样本判定结果',25,MUTED)
f.line(48,442,1072,442,INK)
for x,num,label,c in [(48,'20','通过 · 关闭',GREEN),(328,'1','失败 · 保留证据',RUST),(608,'1','待定 · 等待判断',GOLD),(888,'3','改派 · 交给下游',BLUE)]:
    f.text(x,545,num,72,c,600,font=MONO); f.para(x,595,label,212,24,c)
f.text(48,696,'三次目标回测均通过，并通过基准回归，才判定修复成功。',24,MUTED)
f.save()

# 16 — causal trace from source record to wrong answer.
f=Figure(16,'按来源回答，仍然三次全错','一次数据归因：Prompt 的约束已生效，上游字段却错了。',680)
items=[('上游数据库','把“三级专科”\n误标为“三甲”',RUST),('工具返回','把错误等级\n传给模型',RUST),('模型回答','遵守来源约束\n复述了错误数据',BLUE),('目标回测','0 / 3','',)]
for i,(title,detail,c) in enumerate(items[:3]):
    x=48+i*272; f.text(x,231,title,27,c,600); f.para(x,289,detail,243,26)
    if i<2:f.line(x+219,273,x+252,273,INK,2,arrow=True)
f.line(806,273,840,273,INK,2,arrow=True)
f.text(862,231,'目标回测',27,RUST,600); f.text(862,314,'0/3',57,RUST,600,font=MONO); f.text(862,361,'全部失败',24,RUST)
f.rect(48,429,1024,132,PALE)
f.text(72,476,'Prompt 改动',25,GREEN,600)
f.text(72,520,'等级、排名按工具结果回答，并明确来源。',27)
f.text(48,612,'下一步：带着数据证据改派，继续改措辞解决不了来源错误。',24,MUTED)
f.save()

# 17 — vertical handoff, showing the authority boundary.
f=Figure(17,'修不了的，带着证据交回外循环','修复小队回传判定；全局调度器重新路由。',805)
ys=[210,345,480,615]
roles=[('修复小队','本次无法修复：约束生效，回测仍然失败。',RUST),('父调度器','接收判定、版本、输出与验证证据。',MUTED),('全局调度器','形成状态，按“检索 / 数据”归属重新路由。',BLUE),('检索 / 数据小队','新建接续任务，检查并修正来源。',GREEN)]
for i,(t,d,c) in enumerate(roles):
    y=ys[i]; f.rect(48,y,637,98,PALE if i==3 else BG,c); f.text(72,y+39,t,27,c,600); f.text(72,y+76,d,21,INK)
    if i<3:f.line(366,y+102,366,ys[i+1]-9,INK,2,arrow=True)
f.line(730,210,730,712,RULE)
f.text(772,249,'职责边界',27,GREEN,600)
f.para(772,298,'小队不自行选择下家。\n调度器不重复做诊断。\n改派沿用已有证据。',290,25)
f.text(772,505,'需要人判断时',26,GOLD,600)
f.para(772,552,'把材料送到工单，\n由人确认路由。\n回复后按约定继续。',287,25)
f.save()

# 18 — synthesis, with an explicit coverage bar.
f=Figure(18,'把执行、流转和判定接起来','一轮能完成，下一轮有来处，失败也有人接。',700)
for i,(t,d,c) in enumerate([('Harness','工具、状态、约束和评测\n让每一步可执行、可检查。',GREEN),('Loop','发现、派单、回收和改派\n让任务持续有去向。',BLUE),('角色分工','诊断、实施、验证分开\n执行者不独自判定成功。',GOLD)]):
    x=48+i*348; f.line(x,211,x+328,211,c,4); f.text(x,267,t,33,c,600); f.para(x,321,d,321,25)
f.text(48,474,'约 20%',48,GREEN,600,font=MONO); f.text(289,471,'阶段性记录：由这条链路处理的 bad case',25,MUTED)
f.rect(48,511,1024,29,RULE); f.rect(48,511,205,29,GREEN)
f.text(48,598,'继续记录：关闭、失败、待定、改派，以及人工介入的位置。',24,INK)
f.text(48,646,'覆盖率属于当时的业务范围，不是通用成功率。',22,MUTED)
f.save()

# 19 — a visual shift in human oversight.
f=Figure(19,'人从推流程，转到管流程','定边界、抽样、审计、担责，仍然需要明确的负责人。',780)
f.text(48,220,'过去：逐步推动',29,MUTED,600); f.text(672,220,'现在：在环外监督',29,GREEN,600)
for i,(x,y,t) in enumerate([(260,307,'发现'),(382,430,'归因'),(260,553,'分派'),(138,430,'回收')]):
    f.circle(x,y,7,BG,MUTED); f.text(x,y+(39 if i in(0,2) else -21),t,24,MUTED,anchor='middle')
f.circle(260,430,123,'none',RULE,2); f.text(260,441,'人',42,MUTED,500,'middle')
f.line(478,430,608,430,GREEN,2,arrow=True)
f.circle(856,430,126,PALE,GREEN,2)
f.path('M770 338 A126 126 0 0 1 980 415',GREEN,2,arrow=True)
f.path('M946 522 A126 126 0 0 1 732 446',GREEN,2,arrow=True)
f.text(856,418,'Agent',38,GREEN,600,'middle'); f.text(856,459,'持续流转',25,GREEN,anchor='middle')
for x,y,t,d in [(694,295,'定边界','授权与停止条件'),(1006,295,'抽样看','过程与异常'),(694,601,'审计','版本与证据'),(1006,601,'担责','发布与回滚')]:
    f.text(x,y,t,26,GREEN,600,'middle'); f.text(x,y+35,d,20,MUTED,anchor='middle')
f.text(48,705,'人不必逐个催节点，但关键决策、上线审批和责任仍然保留。',25,INK)
f.save()

# 20 — practical starting sequence; no branded course/resource panels.
f=Figure(20,'从最小的一条链开始','先选一类能复现、能验证的错误。',715)
steps=[('01','自动评测','固定标准与样本\n批量推理、评分、导出'),('02','小闭环','限定一份 Prompt\n改动、部署、回测与回归'),('03','持续调度','定时拉取、去重和派单\n回收结果，处理待定与改派')]
for i,(n,t,d) in enumerate(steps):
    x=48+i*348; f.text(x,237,n,42,GREEN,600,font=MONO); f.text(x,298,t,32,INK,600); f.para(x,357,d,319,25)
    if i<2:f.line(x+221,225,x+317,225,GREEN,2,arrow=True)
f.line(48,493,1072,493,INK)
f.text(48,548,'交回什么',26,GREEN,600)
f.para(48,595,'版本、改动理由、目标回测、基准回归、失败样本、回滚办法。',1009,26)
f.text(48,657,'小闭环稳定后，再增加角色和定时任务。',24,MUTED)
f.save()

(OUT/'figures.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Rebuilt {len(manifest)} figures in {OUT}')
