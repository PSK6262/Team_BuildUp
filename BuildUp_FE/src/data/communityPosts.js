import { freeBoardPosts } from './freeBoardPosts.js'
import { communityTeams } from './communityTeams.js'

// 목록과 상세가 동일한 예시 데이터를 사용합니다. 추후 게시글 API로 교체합니다.
export const communityPosts = [
  ...freeBoardPosts.map((post, index) => ({
    ...post, board: 'free', team: '', likeCount: index * 3,
    content: `${post.title}\n\n축구를 즐기다 보니 다른 팬들은 어떻게 생각하는지 궁금해졌어요.\n저마다 응원하는 팀도, 경기를 보는 관점도 다르니 여러 의견을 들어보고 싶습니다.\n\n여러분의 경험이나 생각도 함께 나눠 주세요!`,
  })),
  ...communityTeams.map((team, index) => ({
    postId: 35 - index, board: 'team', team: team.name,
    userId: (index % 4) + 1, nickname: ['주말축구', '잔디위산책', '후반추가시간', '패스한번'][index % 4],
    title: `${team.name}의 중원 구성, 여러분은 어떻게 생각하시나요?`,
    content: `${team.name}의 전술에 대해 이야기해 보고 싶습니다.\n\n중원에서 공을 지켜 주는 역할과 전방으로 연결해 주는 역할 사이의 균형이 중요하다고 생각해요.\n상대가 강하게 압박할 때 어떤 움직임을 가져가면 좋을까요?\n\n선수 배치와 포메이션에 대한 여러분의 의견이 궁금합니다.`,
    createdAt: `2026-09-16T${String(23 - index).padStart(2, '0')}:00:00`,
    viewCount: 82 + index * 19, likeCount: 7 + index * 4,
  })),
]
