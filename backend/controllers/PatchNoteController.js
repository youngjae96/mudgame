const PatchNote = require('../models/PatchNote');

// 전체 패치노트 목록 조회
exports.getAll = async (req, res) => {
  try {
    const notes = await PatchNote.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: '패치노트 목록 조회 실패' });
  }
};

// 단일 패치노트 조회
exports.getOne = async (req, res) => {
  try {
    const note = await PatchNote.findById(req.params.id);
    if (!note) return res.status(404).json({ error: '패치노트 없음' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: '패치노트 조회 실패' });
  }
};

// 패치노트 생성
exports.create = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = new PatchNote({ title, content });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: '패치노트 생성 실패' });
  }
};

// 패치노트 수정
exports.update = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await PatchNote.findByIdAndUpdate(
      req.params.id,
      { title, content, updatedAt: Date.now() },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: '패치노트 없음' });
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: '패치노트 수정 실패' });
  }
};

// 패치노트 삭제
exports.remove = async (req, res) => {
  try {
    const note = await PatchNote.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: '패치노트 없음' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: '패치노트 삭제 실패' });
  }
}; 