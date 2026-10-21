import React from 'react';
import {
  ChevronDown,
  Info,
  PlusCircle,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  Trash2,
} from 'lucide-react';

export default function SubjectFormTable({
  university,
  setUniversity,
  course,
  setCourse,
  regulation,
  setRegulation,
  gradeSystem,
  setGradeSystem,
  semester,
  setSemester,
  subjects,
  onAddSubject,
  onRemoveSubject,
  onSubjectChange,
  onReset,
  onSubmit,
  gradePointsMap = {},
  regulationName = 'R18',
  scaleDescription = '10 Point Scale',
  validationError = '',
  maxSubjects = 12,
  infoBannerText = 'Enter your subjects, credits and grades to calculate your result.',
  actionButtonText = 'Calculate & Save',
}) {
  return (
    <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
      <div id="result-component" className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
        
        {/* Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-border/80">
          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">Select University</label>
            <div className="relative">
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
              >
                <option value="jntuh">JNTU Hyderabad</option>
                <option value="anna">Anna University</option>
                <option value="osmania">Osmania University</option>
                <option value="generic">Standard 10-Point Scale</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">Select Course</label>
            <div className="relative">
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
              >
                <option value="btech-cse">B.Tech - Computer Science</option>
                <option value="btech-ece">B.Tech - Electronics & Comm</option>
                <option value="btech-it">B.Tech - Information Tech</option>
                <option value="btech-mech">B.Tech - Mechanical Engg</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">Select Regulation</label>
            <div className="relative">
              <select
                value={regulation}
                onChange={(e) => setRegulation(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
              >
                <option value="r18">R18</option>
                <option value="r22">R22</option>
                <option value="r16">R16</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">Select Grade System</label>
            <div className="relative">
              <select
                value={gradeSystem}
                onChange={(e) => setGradeSystem(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
              >
                <option value="10-point">10 Point Scale (Default)</option>
                <option value="4-point">4.0 GPA Scale</option>
                <option value="percentage">Percentage Based Scale</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
            </div>
          </div>

          {setSemester && (
            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">Select Semester</label>
              <div className="relative">
                <select
                  value={semester || 'Semester 1'}
                  onChange={(e) => setSemester(e.target.value)}
                  className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="my-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
          <Info className="w-4 h-4 text-brandBlue shrink-0" />
          <span>{infoBannerText}</span>
        </div>

        {/* Subject Rows Header */}
        <div className="flex items-center justify-between pb-2.5">
          <h3 className="text-sm font-bold text-text-h">Enter Subject Details</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg-sec border border-border text-text-m">
            {subjects.length} Subjects
          </span>
        </div>

        {/* Table Rows */}
        <div className="space-y-2 mt-2">
          {/* Desktop Table Headers */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light px-2 border-b border-border/50">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">SUBJECT NAME</div>
            <div className="col-span-2 text-center">CREDITS</div>
            <div className="col-span-2 text-center">GRADE</div>
            <div className="col-span-1 text-center">POINTS</div>
            <div className="col-span-1 text-center">ACTION</div>
          </div>

          {subjects.map((sub, idx) => (
            <div key={sub.id} className="p-2.5 rounded-xl border border-border bg-card hover:border-accent/40 transition-colors">
              {/* Desktop Row View */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-center font-bold text-xs text-text-light">{idx + 1}</div>
                <div className="col-span-5">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => onSubjectChange(sub.id, 'name', e.target.value)}
                    placeholder="Subject Name"
                    className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={sub.credits}
                    onChange={(e) => onSubjectChange(sub.id, 'credits', e.target.value)}
                    className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={sub.grade}
                    onChange={(e) => onSubjectChange(sub.id, 'grade', e.target.value)}
                    className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {Object.keys(gradePointsMap).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 text-center font-extrabold text-xs text-text-h bg-orange-500/10 border border-border py-1.5 rounded-lg">
                  {gradePointsMap[sub.grade] ?? 0}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveSubject(sub.id)}
                    className="w-7 h-7 rounded-lg text-brandPink hover:bg-brandPink/10 transition-colors inline-flex items-center justify-center"
                    aria-label={`Delete row ${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mobile Row View */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-h">#{idx + 1} Subject</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSubject(sub.id)}
                    className="text-xs font-semibold text-brandPink flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={sub.name}
                  onChange={(e) => onSubjectChange(sub.id, 'name', e.target.value)}
                  placeholder="Subject Name"
                  className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs"
                />
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="text-[10px] text-text-light font-semibold block mb-0.5">Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={sub.credits}
                      onChange={(e) => onSubjectChange(sub.id, 'credits', e.target.value)}
                      className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-light font-semibold block mb-0.5">Grade</label>
                    <select
                      value={sub.grade}
                      onChange={(e) => onSubjectChange(sub.id, 'grade', e.target.value)}
                      className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                    >
                      {Object.keys(gradePointsMap).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-light font-semibold block mb-0.5">Points</label>
                    <div className="calc-input w-full py-1.5 text-center rounded-lg text-xs font-extrabold bg-orange-500/10 text-text-h">
                      {gradePointsMap[sub.grade] ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Subject Row */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={onAddSubject}
            disabled={subjects.length >= maxSubjects}
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-accent/70 bg-accent-soft/40 hover:bg-accent-soft text-xs font-bold text-accent transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Another Subject</span>
          </button>
          {validationError && (
            <p className="text-[11px] text-brandPink mt-1.5 text-center font-medium">{validationError}</p>
          )}
        </div>

        {/* Grade System Reference Badges */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-h">
              GRADE SYSTEM ({regulationName})
            </h4>
            <span className="text-[11px] text-text-light font-medium">{scaleDescription}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {Object.entries(gradePointsMap).map(([grade, pts]) => (
              <div key={grade} className="p-2 rounded-xl border border-border bg-card text-center">
                <div className={`text-[11px] font-bold ${grade === 'F' ? 'text-brandPink' : 'text-accent'}`}>{grade}</div>
                <div className="text-xs font-extrabold text-text-h mt-0.5">{pts}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-xs font-semibold text-text-m hover:text-text-h transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{actionButtonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}