jest.mock('../models/Expert', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../models/ExpertSlot', () => ({
  find: jest.fn(),
  insertMany: jest.fn()
}));

jest.mock('../models/Appointment', () => ({
  find: jest.fn()
}));

jest.mock('../models/User', () => ({
  find: jest.fn(),
  findById: jest.fn()
}));

jest.mock('../models/Review', () => ({
  find: jest.fn()
}));

const Expert = require('../models/Expert');
const ExpertSlot = require('../models/ExpertSlot');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { createExpertSlots, getExpertSlots } = require('./expertController');

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  }
});

describe('expert slot management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks overlapping slots in the same request', async () => {
    const req = {
      user: { id: 'expert-user-1' },
      body: {
        slots: [
          { date: '2030-05-10', startTime: '10:00', endTime: '11:00' },
          { date: '2030-05-10', startTime: '10:30', endTime: '11:30' }
        ]
      }
    };
    const res = createResponse();
    const next = jest.fn();

    Expert.findOne.mockResolvedValue({ _id: 'expert-profile-1', userId: 'expert-user-1' });

    await createExpertSlots(req, res, next);

    expect(ExpertSlot.insertMany).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(409);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Overlapping slots are not allowed');
  });

  test('creates slots when no overlap exists', async () => {
    const req = {
      user: { id: 'expert-user-1' },
      body: {
        slots: [
          { date: '2030-05-10', startTime: '10:00', endTime: '11:00' },
          { date: '2030-05-10', startTime: '11:00', endTime: '12:00' }
        ]
      }
    };
    const res = createResponse();
    const next = jest.fn();
    const expertProfile = { _id: 'expert-profile-1', userId: 'expert-user-1' };

    Expert.findOne.mockResolvedValue(expertProfile);
    ExpertSlot.find.mockResolvedValue([]);
    Appointment.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([])
    });
    ExpertSlot.insertMany.mockImplementation(async (items) => items);

    await createExpertSlots(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(ExpertSlot.insertMany).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.payload.data).toHaveLength(2);
  });

  test('returns slots for an expert with unavailable flags', async () => {
    const req = {
      params: { expertId: 'expert-profile-1' },
      query: {}
    };
    const res = createResponse();
    const next = jest.fn();
    const expertProfile = { _id: 'expert-profile-1', userId: 'expert-user-1' };
    const slots = [
      { startTime: '10:00', endTime: '11:00', status: 'available' },
      { startTime: '11:00', endTime: '12:00', status: 'booked' }
    ];

    Expert.findById.mockResolvedValue(expertProfile);
    ExpertSlot.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(slots)
      })
    });

    await getExpertSlots(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.payload.data[0].unavailable).toBe(false);
    expect(res.payload.data[1].unavailable).toBe(true);
  });
});
