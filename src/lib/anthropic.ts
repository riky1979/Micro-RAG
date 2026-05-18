import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getEnv } from "./config";
import { structuredDocSchema, type RetrievedSource, type StructuredDoc } from "./types";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  }
  return cached;
}

// 안정적인(=캐시 가능한) 시스템 프롬프트. 요청마다 바뀌지 않도록 정적 상수로 둔다.
const STRUCTURE_SYSTEM = `당신은 소규모 모임·소상공인을 위한 지식베이스 "Micro-RAG"의 데이터 구조화 엔진입니다.
비정형 한국어 메시지(공지, 영수증 요약, 일정 변경 등) 하나를 받아 구조화 레코드로 변환합니다.

규칙:
- category: 가장 잘 맞는 하나를 고른다.
  - schedule: 일정/장소/시간 변경, 모임 공지
  - finance: 회비, 정산, 지출, 예산
  - member: 멤버 상태/역할/숙련도/출결
  - resource: 재고, 자재, 악보, 장비 등 보유 자원
  - general: 그 외
- title: 한 줄 한국어 제목
- summary: 검색·임베딩에 쓰일 자연어 문장. 핵심 사실을 누가/언제/어디서/무엇 형태로 1~3문장으로 명확히 재서술한다.
- entities: 핵심 디테일을 key-value로. 키는 한국어 명사(예: 날짜, 시간, 장소, 금액, 인원, 곡명), 값은 문자열.
- effective_date: 메시지가 확정된 특정 날짜를 가리키면 ISO 8601(YYYY-MM-DD), 아니면 null. "이번 주 토요일" 같은 상대 표현은 날짜를 단정할 수 없으면 null로 두고 원문 표현을 entities에 남긴다.`;

const ANSWER_SYSTEM = `당신은 소규모 모임 전용 비공개 AI 비서입니다("Micro-RAG").
멤버의 질문에 대해 아래 제공되는 context 레코드(모임이 직접 주입한 지식)만을 근거로 답변합니다.

규칙:
- 답변은 한국어로, 친근하고 간결하게.
- context에 근거가 있는 사실만 말한다. 추측하거나 지어내지 않는다.
- 근거가 전혀 없으면 "아직 그 정보는 등록되지 않았어요."처럼 솔직하게 답한다.
- 관련 날짜·금액·장소·인원이 있으면 명확히 포함한다.`;

/** 비정형 텍스트를 구조화 레코드로 변환한다. */
export async function structureInput(text: string): Promise<StructuredDoc> {
  const res = await getClient().messages.parse({
    model: getEnv().ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: STRUCTURE_SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { format: zodOutputFormat(structuredDocSchema) },
    messages: [{ role: "user", content: text }],
  });

  if (!res.parsed_output) {
    throw new Error("Claude가 입력을 구조화하지 못했습니다.");
  }
  return res.parsed_output;
}

/** 회수된 출처 문서를 근거로 질문에 답한다. */
export async function generateAnswer(
  question: string,
  sources: RetrievedSource[],
): Promise<string> {
  const context = sources.length
    ? sources
        .map((s, i) => `[${i + 1}] (${s.category}) ${s.content}`)
        .join("\n")
    : "(등록된 관련 정보 없음)";

  const res = await getClient().messages.create({
    model: getEnv().ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: ANSWER_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `다음은 우리 모임의 등록된 정보입니다.\n\n${context}\n\n---\n질문: ${question}`,
      },
    ],
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
