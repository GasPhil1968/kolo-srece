import type { DialogDef } from '../../engine/types';
import { S, clue, give, set, take } from '../dsl';

export const gus: DialogDef = {
  id: 'gus',
  npc: 'gus',
  nodes: {
    root: {
      lines: [{
        once: 'c2_gus_intro',
        do: [
          S('gus', 'Morning, Sergeant. You look like something the tide wouldn’t take.'),
          'You know me?',
          S('gus', 'Course I do. Gus Tolliver. I’ve been watching this pier since before you had a badge.'),
          { person: 'gus' },
        ],
      }],
      options: [
        {
          id: 'saw', text: 'Did you see what happened to me last night?', when: 'chapter=2',
          do: [
            S('gus', 'Two fellas dragged you in there round midnight and came out without you.'),
            S('gus', 'One big, camel coat. The other had a white jacket under his raincoat. Hospital type.'),
            'And you didn’t think to let me out?',
            S('gus', 'I thought you was working undercover. Very under.'),
            clue('gus_saw'),
          ],
        },
        {
          id: 'week', text: 'Had you seen me here before?', when: 'chapter=2',
          do: [
            S('gus', 'A week back. You and Walter’s girl. Went in the cold store with a parcel, came out without it.'),
            S('gus', 'You looked like you’d seen a ghost. She looked like she was one.'),
          ],
        },
        {
          id: 'meridian', text: 'Tell me about the Meridian.',
          do: [
            S('gus', 'Fourteen men in her hold when she burned. Fourteen. Walter Marsh among ’em.'),
            S('gus', 'I was on watch that night. Heard hammering at the forward hatch, maybe half an hour before the fire. Iron on iron.'),
            S('gus', 'Told the police. A big detective with a nice coat wrote it down, then told me I was drunk.'),
            'Were you?',
            S('gus', 'Not yet.'),
            clue('gus_hammering'),
          ],
        },
        {
          id: 'detective', text: 'Which detective?', when: 'seen:gus.meridian',
          do: [
            S('gus', 'Didn’t give a name. Didn’t need to. Nice coat, big hands, laughed a lot.'),
            S('gus', 'Funny thing to laugh at, fourteen men.'),
          ],
        },
        {
          id: 'gulls', text: 'Do the gulls tell you anything?', once: true,
          do: [
            S('gus', 'Plenty. Mostly about fish. Sometimes about people.'),
            S('gus', 'You’d be surprised what a gull sees. Nobody ever looks up to see who’s watching.'),
          ],
        },
        {
          id: 'log', text: 'Do you keep a log, Gus?', when: 'chapter<=6',
          do: [
            S('gus', 'Every night for forty years. The Company keeps the official one. I keep mine.'),
            'Can I see it?',
            S('gus', 'When I trust you with it, Sergeant. You’re getting there.'),
          ],
        },
        {
          id: 'log7', text: 'Gus, I need your log. For Walter.', when: 'chapter=7 & c7_planned & !has:gus_log',
          do: [
            S('gus', 'For Walter.'),
            S('gus', 'Here. Forty years of fog and gulls, and one night I’d give the rest to forget.'),
            give('gus_log'),
            'Thank you, Gus.',
            S('gus', 'Don’t thank me. Make them listen.'),
          ],
        },
        { id: 'bye', text: 'Keep an eye on the pier, Gus.', next: 'exit', do: [S('gus', 'Always do. Somebody has to.')] },
      ],
    },
  },
};

export const kessler: DialogDef = {
  id: 'kessler',
  npc: 'kessler',
  nodes: {
    root: {
      lines: [{
        once: 'c2_kessler_intro',
        do: [
          S('kessler', 'Mr. Rook. You look as though you need something from my shelves.'),
          S('kessler', 'Most people who come in look like that. Few of them are right.'),
          { person: 'kessler' },
        ],
      }],
      options: [
        {
          id: 'vial', text: 'Can you tell me what’s in this vial?', when: 'has:vial & !c2_vial_testing & !clue:lethe_identified',
          do: [
            S('kessler', 'L-7. Halcyon House. Hmm.'),
            S('kessler', 'Leave it with me. I’ll run some tests in the back. Come back in a little while.'),
            S('kessler', 'Tests take time, and time takes longer when you watch it.'),
            take('vial'), set('c2_vial_testing'),
          ],
        },
        {
          id: 'wait', text: 'Any news on the vial?', when: 'c2_vial_testing & !c2_vial_ready',
          do: [S('kessler', 'Chemistry is not a newspaper, Mr. Rook. Go and walk around the block. Twice.')],
        },
        {
          id: 'result', text: 'So what is it?', when: 'c2_vial_ready & !clue:lethe_identified',
          do: [
            S('kessler', 'Scopolamine. Refined, very pure, and cut with a barbiturate to smooth the edges.'),
            S('kessler', 'In the Andes they call the plant borrachero. The drunkard-maker.'),
            S('kessler', 'A man dosed with this does what he is told, with a smile. And afterwards he remembers nothing. Not one thing.'),
            '...Six days’ worth?',
            S('kessler', 'Repeated? A strong enough dose? I would not like to guess what it could erase.'),
            clue('lethe_identified'),
            'How would you get it into a man?',
            S('kessler', 'In a drink. It is bitter, so you would hide it in something strong. Anise. Licorice.'),
            clue('anise'),
            { if: 'c1_drink_offered', then: ['Anisette.', 'Sal offered me anisette. On the house.'] },
            S('kessler', 'Your vial. Keep it somewhere safe, and keep it away from your coffee.'),
            give('vial'), { unset: 'c2_vial_testing' },
            S('kessler', 'You are the second man this year to ask me about Halcyon House. A reporter from the Gazette came in August. Pike.'),
            S('kessler', 'I have not seen him since.'),
            { unlock: 'gazette' },
            { person: 'vey' },
          ],
        },
        {
          id: 'who', text: 'Who would buy something like that?', when: 'clue:lethe_identified',
          do: [
            S('kessler', 'Hospitals, for “twilight sleep”. Halcyon House bought scopolamine from me for years.'),
            S('kessler', 'Two years ago they stopped. Dr. Vey said he had found another supplier.'),
            S('kessler', 'I was offended. I see now I should have been relieved.'),
            clue('halcyon_scopolamine'),
          ],
        },
        {
          id: 'antidote', text: 'Is there anything that undoes it?', when: 'clue:lethe_identified & chapter<=6',
          do: [
            S('kessler', 'Physostigmine reverses scopolamine poisoning. It clears the fog in a man who is under it.'),
            S('kessler', 'It does not give back what was already lost. Nothing does that.'),
          ],
        },
        {
          id: 'antidote7', text: 'I need physostigmine. Tonight.', when: 'chapter=7 & c7_planned & !has:antidote',
          do: [
            S('kessler', 'For whom?'),
            'For me, if they get a needle into me before nine o’clock.',
            S('kessler', '...One ampoule. Into the arm. It will clear the fog for an hour, perhaps less.'),
            give('antidote'),
            S('kessler', 'An hour is a long time, Mr. Rook, if you use it well.'),
          ],
        },
        { id: 'bye', text: 'Thank you, Mr. Kessler.', next: 'exit', do: [S('kessler', 'Mind the step. Everyone trips on the step.')] },
      ],
    },
  },
};

export const abernathy: DialogDef = {
  id: 'abernathy',
  npc: 'abernathy',
  nodes: {
    root: {
      lines: [{
        once: 'c2_abernathy_intro',
        do: [S('abernathy', 'Rook. You look worse than our coverage of you.'), { person: 'abernathy' }],
      }],
      options: [
        {
          id: 'pike', text: 'What happened to Wendell Pike?',
          do: [
            S('abernathy', 'Best muckraker I ever had. In August he went up Gull Hill to write about Halcyon House. Never filed.'),
            S('abernathy', 'His landlady says he came home once, didn’t know her name, and walked out again.'),
            S('abernathy', 'The police say he’s on a bender. Pike didn’t drink. Pike didn’t even drink coffee. He was a very irritating man.'),
            clue('pike_missing'), { person: 'pike' },
          ],
        },
        {
          id: 'desk', text: 'Can I look at Pike’s desk?', when: 'seen:abernathy.pike',
          do: [
            S('abernathy', 'Help yourself. It’s the mess with the hat on it.'),
            S('abernathy', 'The drawer’s locked. Pike locked everything.'),
            'Combination?',
            S('abernathy', 'He used his press number for everything. Locks, bets, his laundry ticket.'),
            S('abernathy', 'Said it was the only number he could remember.'),
            set('c2_desk_ok'),
          ],
        },
        {
          id: 'meridian', text: 'What did you print about the Meridian?',
          do: [
            S('abernathy', 'The official story. Galley fire. I didn’t like it then.'),
            S('abernathy', 'I like it less with you standing in my newsroom asking.'),
            S('abernathy', 'The clippings are in the morgue cabinet. Help yourself.'),
            set('c2_clippings_ok'),
          ],
        },
        {
          id: 'darkroom', text: 'Can I use your darkroom?', when: 'has:pike_camera & chapter=2',
          do: [
            S('abernathy', 'After the night shift goes home, around eight. Lock up after yourself.'),
            S('abernathy', 'And if there’s a story on that roll, Rook, it’s mine.'),
          ],
        },
        {
          id: 'contact', text: 'Look at these photographs.', when: 'chapter=3 & has:contact_sheet & !seen:abernathy.contact',
          do: [
            S('abernathy', 'That’s Dr. Lucian Vey. Halcyon House. He sends us a Christmas card. Nobody signs it.'),
            S('abernathy', 'The other fellow could be anyone with a good tailor and a gold lighter. Which narrows it to half of City Hall.'),
          ],
        },
        {
          id: 'pass', text: 'I need to get into Crane’s gala tonight.', when: 'chapter=7 & c7_planned & !has:press_pass',
          do: [
            S('abernathy', 'And I need a publisher who isn’t in hock to Augustus Crane’s bank.'),
            'Read this. All of it.',
            { narrate: 'Abernathy read the transcript pages twice, then took off his visor and rubbed his eyes.' },
            S('abernathy', 'I can’t print it. They’d close us by Monday and sue the paper boys.'),
            S('abernathy', 'But I can’t hand you a pass with my name on it. Bring me a blank form and a stamp, and I’ll look the other way.'),
          ],
        },
        { id: 'bye', text: 'Thanks, Abernathy.', next: 'exit', do: [S('abernathy', 'Bring me something I can print, Rook.')] },
      ],
    },
  },
};

export const agnes: DialogDef = {
  id: 'agnes',
  npc: 'agnes',
  nodes: {
    root: {
      lines: [{
        once: 'c2_agnes_intro',
        do: [
          S('agnes', 'If you’re here for soup, sit. If you’re here for questions, sit anyway. You look like you need soup.'),
          { person: 'agnes' },
        ],
      }],
      options: [
        {
          id: 'forgotten', text: 'Who are all these people, Sister?',
          do: [
            S('agnes', 'The forgotten. They come down from the hill, from that Halcyon place, with clean shirts and empty heads.'),
            S('agnes', 'They don’t know their own names. We give them soup, and new ones.'),
            clue('mission_forgotten'),
          ],
        },
        {
          id: 'kerrigan', text: 'Is there a Mick Kerrigan here?', when: 'clue:pike_notes | clue:mission_forgotten',
          do: [
            S('agnes', 'Mick sleeps here most nights. He doesn’t remember a thing before 1950.'),
            S('agnes', 'Some nights he wakes up screaming about fire and a locked hatch. That’s him at the end table.'),
            S('agnes', 'Be gentle with him, Mr. Rook. He breaks easily, and I’m the one who sweeps up.'),
            set('c2_kerrigan_ok'), { person: 'kerrigan' },
          ],
        },
        {
          id: 'nora', text: 'Do you know Nora Marsh?', when: 'has:nora_photo & chapter<=5',
          do: [
            S('agnes', 'Walter Marsh’s girl. She lights a candle here for her father every Sunday.'),
            S('agnes', 'I’d leave her to her candles, Mr. Rook. Some people are better left to their candles.'),
          ],
        },
        {
          id: 'volunteer', text: 'Who’s the girl serving soup?', when: 'chapter<=5',
          do: [S('agnes', 'Annie. A volunteer. God sends me volunteers the way He sends rain: when He feels like it, and never enough.')],
        },
        { id: 'bye', text: 'Thank you, Sister.', next: 'exit', do: [S('agnes', 'Go with God. Or at least go carefully.')] },
      ],
    },
  },
};

export const volunteer: DialogDef = {
  id: 'volunteer',
  npc: 'volunteer',
  nodes: {
    root: {
      options: [
        { id: 'soup', text: 'Is the soup any good?', do: [S('volunteer', 'It’s hot. That’s the most anyone ever says about it.')] },
        {
          id: 'met', text: 'Have we met?',
          do: [{ wait: 500 }, S('volunteer', '...Everyone’s met everyone in Brackwater, mister.'), clue('volunteer')],
        },
        { id: 'name', text: 'What’s your name?', do: [S('volunteer', 'Annie. Sister Agnes calls me Annie.')] },
        {
          id: 'look', text: 'You could look at me when you talk.', when: 'seen:volunteer.met',
          do: [S('volunteer', 'I’m watching the pot. If I don’t watch it, it burns.'), S('volunteer', 'A lot of things are like that.')],
        },
        { id: 'bye', text: 'Thanks for the soup.', next: 'exit', do: [S('volunteer', 'Mind how you go.')] },
      ],
    },
  },
};

export const kerrigan: DialogDef = {
  id: 'kerrigan',
  npc: 'kerrigan',
  nodes: {
    root: {
      options: [
        {
          id: 'meridian', text: 'Mick? Do you remember the Meridian?', when: 'c2_kerrigan_ok | clue:pike_notes',
          do: [
            S('kerrigan', 'The what? Don’t know any Meridian.'),
            'A ship. October, two years ago. Pier 9.',
            { wait: 600 },
            S('kerrigan', '...Fire. There was fire. And the hatch. They pounded on the hatch.'),
            S('kerrigan', 'I wasn’t in the hold. I was on deck. I saw a man putting a padlock on the hatch. A big man.'),
            S('kerrigan', 'I said “Oi!” and he said... he said, “Go home, Mick.”'),
            S('kerrigan', 'He knew my name. Then a white room. Then nothing.'),
            clue('kerrigan'),
          ],
        },
        {
          id: 'face', text: 'Did you see his face?', when: 'seen:kerrigan.meridian',
          do: [S('kerrigan', 'A hat. A good coat. He laughed.'), S('kerrigan', 'Who laughs?')],
        },
        { id: 'soup', text: 'How’s the soup, Mick?', do: [S('kerrigan', 'Hot.'), S('kerrigan', 'I had a name once. Now I have soup.')] },
        { id: 'bye', text: 'Take care, Mick.', next: 'exit', do: [S('kerrigan', 'Go home, Mick. That’s what he said. Go home.')] },
      ],
    },
  },
};
