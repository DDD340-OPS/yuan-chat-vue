import { createMessage, createSession } from './sessionFactory'

export function createInitialSessions() {
  return [
    createSession({
      title: '睡眠与考试压力样本',
      participant: '匿名样本 A',
      stage: '初访',
      messages: [
        createMessage(
          'assistant',
          '你好，我们可以先从最近最困扰你的场景开始说。最近哪件事最容易让你紧张或睡不着？'
        ),
        createMessage('user', '最近备考的时候总担心考不好，晚上躺下以后脑子一直转，几乎睡不着。'),
        createMessage(
          'assistant',
          '听起来考试压力和睡眠问题正在相互影响。我们可以继续梳理，是哪些想法会在晚上反复出现。'
        )
      ]
    }),
    createSession({
      title: '社交回避跟进样本',
      participant: '匿名样本 B',
      stage: '跟进',
      messages: [
        createMessage(
          'assistant',
          '上次你提到在人多的时候会想躲开，这一周有没有类似场景再次出现？'
        ),
        createMessage('user', '有，开组会前我就很紧张，总觉得别人会盯着我说错话。'),
        createMessage(
          'assistant',
          '这像是典型的社交敏感场景。我们可以关注当时的自动想法，以及身体反应最明显的部分。'
        )
      ]
    }),
    createSession({
      title: '家庭沟通与情绪波动',
      participant: '匿名样本 C',
      stage: '总结',
      messages: [
        createMessage(
          'assistant',
          '如果把最近一次和家人冲突的过程拆开，你觉得最刺痛你的那句话是什么？'
        ),
        createMessage('user', '我爸说我总是想太多，我一下子就很委屈，也不想再解释了。'),
        createMessage(
          'assistant',
          '被否定感似乎很强，我们可以把“委屈”的背后需求也一起找出来。'
        )
      ]
    })
  ]
}
